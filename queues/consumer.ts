import { getDb } from "./db";
import { webhookMessages, webhookAttempts, endpoints, proxyServers, proxyGroups } from "../src/db/webhooks.schema";
import { eq, and } from "drizzle-orm";

interface WebhookMessage {
  id: string;
  endpointIds: string[];
  endpointGroups: string[];
  eventType: string;
  eventId?: string;
  payload: any;
  timestamp: string;
  idempotencyKey?: string;
}

export default {
  async queue(
    batch: MessageBatch,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    for (const message of batch.messages) {
      try {
        const webhookData = message.body as WebhookMessage;
        console.log('Processing webhook:', webhookData.id);

        // Update status to processing
        const db = await getDb(env);
        
        // Get current message to increment attempts
        const currentMessage = await db
          .select({ attempts: webhookMessages.attempts })
          .from(webhookMessages)
          .where(eq(webhookMessages.id, webhookData.id))
          .limit(1);
        
        const currentAttempts = currentMessage[0]?.attempts || 0;
        
        await db
          .update(webhookMessages)
          .set({ 
            status: "processing",
            processingStartedAt: new Date(),
            attempts: currentAttempts + 1
          })
          .where(eq(webhookMessages.id, webhookData.id));

        // Process each endpoint
        const allEndpoints = [
          ...webhookData.endpointIds,
          ...webhookData.endpointGroups
        ];

        let allSuccessful = true;
        const results = [];

        for (const endpointId of allEndpoints) {
          try {
            const result = await processWebhookDelivery(webhookData, endpointId, db);
            results.push(result);
            
            if (!result.success) {
              allSuccessful = false;
            }
          } catch (error) {
            console.error(`Error processing endpoint ${endpointId}:`, error);
            allSuccessful = false;
            results.push({
              endpointId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Update final status
        const finalStatus = allSuccessful ? "delivered" : "failed";
        const updateData: any = {
          status: finalStatus,
          attempts: currentAttempts + 1
        };

        if (allSuccessful) {
          updateData.deliveredAt = new Date();
        } else {
          updateData.failedAt = new Date();
          updateData.lastError = results.find(r => !r.success)?.error || 'Unknown error';
          updateData.lastErrorAt = new Date();
        }

        await db
          .update(webhookMessages)
          .set(updateData)
          .where(eq(webhookMessages.id, webhookData.id));

        console.log(`Webhook ${webhookData.id} processed with status: ${finalStatus}`);

      } catch (error) {
        console.error('Error processing webhook message:', error);
        
        // Update message status to failed
        try {
          const db = await getDb(env);
          const webhookData = message.body as WebhookMessage;
          
          // Get current attempts
          const currentMessage = await db
            .select({ attempts: webhookMessages.attempts })
            .from(webhookMessages)
            .where(eq(webhookMessages.id, webhookData.id))
            .limit(1);
          
          const currentAttempts = currentMessage[0]?.attempts || 0;
          
          await db
            .update(webhookMessages)
            .set({
              status: "failed",
              failedAt: new Date(),
              lastError: error instanceof Error ? error.message : 'Unknown error',
              lastErrorAt: new Date(),
              attempts: currentAttempts + 1
            })
            .where(eq(webhookMessages.id, webhookData.id));
        } catch (dbError) {
          console.error('Error updating webhook status in database:', dbError);
        }
      }
    }
  },
};

async function processWebhookDelivery(
  webhookData: WebhookMessage, 
  endpointId: string, 
  db: any
): Promise<{ endpointId: string; success: boolean; error?: string; responseTime?: number }> {
  const startTime = Date.now();

  let endpointData = null;
  
  try {
    // Get endpoint details from database
    const endpoint = await db
      .select()
      .from(endpoints)
      .where(eq(endpoints.id, endpointId))
      .limit(1);

    if (!endpoint[0]) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    endpointData = endpoint[0];
    
    // Check if endpoint has a proxy group assigned
    let selectedProxy = null;
    
    if (endpointData.proxyGroupId) {
      // Get proxy group and select a proxy from it
      const proxyGroup = await db
        .select()
        .from(proxyGroups)
        .where(eq(proxyGroups.id, endpointData.proxyGroupId))
        .limit(1);

      if (proxyGroup[0] && proxyGroup[0].isActive) {
        const proxyIds = JSON.parse(proxyGroup[0].proxyIds);
        
        if (proxyIds.length > 0) {
          // Get active proxy servers from the group
          const proxies = await db
            .select()
            .from(proxyServers)
            .where(
              and(
                eq(proxyServers.environmentId, endpointData.environmentId),
                eq(proxyServers.isActive, true)
              )
            );

          const groupProxies = proxies.filter((proxy: any) => proxyIds.includes(proxy.id));
          
          if (groupProxies.length > 0) {
            // Select proxy based on load balancing strategy
            if (proxyGroup[0].loadBalancingStrategy === 'round_robin') {
              // Simple round-robin (could be improved with state tracking)
              selectedProxy = groupProxies[Math.floor(Math.random() * groupProxies.length)];
            } else {
              // Random selection (default)
              selectedProxy = groupProxies[Math.floor(Math.random() * groupProxies.length)];
            }
          }
        }
      }
    }

    // If no proxy selected, fall back to direct delivery
    if (!selectedProxy) {
      console.log(`No proxy assigned for endpoint ${endpointId}, using direct delivery`);
      return await processDirectDelivery(webhookData, endpointData, db);
    }
    
    // Prepare proxy request
    const proxyRequest = {
      targetUrl: endpointData.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookService/1.0',
        'X-Webhook-Event': webhookData.eventType,
        'X-Webhook-ID': webhookData.id,
        ...(webhookData.idempotencyKey && { 'Idempotency-Key': webhookData.idempotencyKey })
      },
      payload: webhookData.payload,
      timeout: endpointData.timeoutMs || 30000,
      idempotencyKey: webhookData.idempotencyKey
    };

    // Send request through proxy with authentication
    const response = await fetch(`${selectedProxy.url}/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookService/1.0',
        'Authorization': `Bearer ${selectedProxy.secret}`
      },
      body: JSON.stringify(proxyRequest),
      signal: AbortSignal.timeout(endpointData.timeoutMs || 30000)
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();
    
    let proxyResponse;
    try {
      proxyResponse = JSON.parse(responseBody);
    } catch {
      proxyResponse = { success: false, error: 'Invalid proxy response' };
    }

    // Log the attempt
    await db.insert(webhookAttempts).values({
      id: crypto.randomUUID(),
      messageId: webhookData.id,
      endpointId,
      attemptNumber: 1, // TODO: Get actual attempt number
      requestUrl: endpointData.url,
      requestMethod: 'POST',
      requestHeaders: JSON.stringify(proxyRequest.headers),
      requestBody: JSON.stringify(webhookData.payload),
      responseStatus: proxyResponse.status || response.status,
      responseHeaders: JSON.stringify(proxyResponse.headers || Object.fromEntries(response.headers.entries())),
      responseBody: proxyResponse.body ? JSON.stringify(proxyResponse.body) : responseBody,
      responseTimeMs: proxyResponse.responseTime || responseTime,
      status: proxyResponse.success ? 'success' : 'failed',
      errorMessage: proxyResponse.success ? null : (proxyResponse.error || `HTTP ${response.status}: ${responseBody}`),
      attemptedAt: new Date(),
      completedAt: new Date()
    });

    if (proxyResponse.success) {
      return { endpointId, success: true, responseTime: proxyResponse.responseTime || responseTime };
    } else {
      return { 
        endpointId, 
        success: false, 
        error: proxyResponse.error || `HTTP ${response.status}: ${responseBody}`,
        responseTime: proxyResponse.responseTime || responseTime
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the failed attempt
    await db.insert(webhookAttempts).values({
      id: crypto.randomUUID(),
      messageId: webhookData.id,
      endpointId,
      attemptNumber: 1,
      requestUrl: endpointData?.url || 'unknown',
      requestMethod: 'POST',
      requestHeaders: JSON.stringify({
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookService/1.0',
        'X-Webhook-Event': webhookData.eventType,
        'X-Webhook-ID': webhookData.id,
      }),
      requestBody: JSON.stringify(webhookData.payload),
      responseTimeMs: responseTime,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      attemptedAt: new Date(),
      completedAt: new Date()
    });

    return { 
      endpointId, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime 
    };
  }
}

// Direct delivery function (fallback when no proxy is assigned)
async function processDirectDelivery(
  webhookData: WebhookMessage, 
  endpointData: any, 
  db: any
): Promise<{ endpointId: string; success: boolean; error?: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    // Make direct HTTP request to endpoint
    const response = await fetch(endpointData.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookService/1.0',
        'X-Webhook-Event': webhookData.eventType,
        'X-Webhook-ID': webhookData.id,
        ...(webhookData.idempotencyKey && { 'Idempotency-Key': webhookData.idempotencyKey })
      },
      body: JSON.stringify(webhookData.payload),
      signal: AbortSignal.timeout(endpointData.timeoutMs || 30000)
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    // Log the attempt
    await db.insert(webhookAttempts).values({
      id: crypto.randomUUID(),
      messageId: webhookData.id,
      endpointId: endpointData.id,
      attemptNumber: 1, // TODO: Get actual attempt number
      requestUrl: endpointData.url,
      requestMethod: 'POST',
      requestHeaders: JSON.stringify({
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookService/1.0',
        'X-Webhook-Event': webhookData.eventType,
        'X-Webhook-ID': webhookData.id,
      }),
      requestBody: JSON.stringify(webhookData.payload),
      responseStatus: response.status,
      responseHeaders: JSON.stringify(Object.fromEntries(response.headers.entries())),
      responseBody: responseBody.length > 1000 ? responseBody.substring(0, 1000) + '...' : responseBody,
      responseTimeMs: responseTime,
      status: response.ok ? 'success' : 'failed',
      errorMessage: response.ok ? null : `HTTP ${response.status}: ${responseBody}`,
      attemptedAt: new Date(),
      completedAt: new Date()
    });

    if (response.ok) {
      return { endpointId: endpointData.id, success: true, responseTime };
    } else {
      return { 
        endpointId: endpointData.id, 
        success: false, 
        error: `HTTP ${response.status}: ${responseBody}`,
        responseTime 
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the failed attempt
    await db.insert(webhookAttempts).values({
      id: crypto.randomUUID(),
      messageId: webhookData.id,
      endpointId: endpointData.id,
      attemptNumber: 1,
      requestUrl: endpointData.url,
      requestMethod: 'POST',
      requestHeaders: JSON.stringify({
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookService/1.0',
        'X-Webhook-Event': webhookData.eventType,
        'X-Webhook-ID': webhookData.id,
      }),
      requestBody: JSON.stringify(webhookData.payload),
      responseTimeMs: responseTime,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      attemptedAt: new Date(),
      completedAt: new Date()
    });

    return { 
      endpointId: endpointData.id, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime 
    };
  }
}