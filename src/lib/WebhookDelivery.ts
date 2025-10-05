import { webhookAttempts, endpoints, proxyServers, proxyGroups } from "../db/webhooks.schema";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "../db/schema";

interface WebhookMessage {
  id: string;
  endpointId: string;
  eventType: string;
  eventId?: string;
  payload: any | null; // Can be null if stored in KV
  payloadKey?: string | null; // KV key for large payloads
  timestamp: string;
  idempotencyKey?: string;
  retryConfig: {
    maxAttempts: number;
    retryPolicy: "none" | "retry";
    backoffStrategy: "linear" | "exponential" | "fixed";
    baseDelaySeconds: number;
  };
  isManualRetry?: boolean;
  originalMessageId?: string;
}

interface DeliveryResult {
  endpointId: string;
  success: boolean;
  error?: string;
  responseTime?: number;
}

interface EndpointData {
  id: string;
  url: string;
  environmentId: string;
  proxyGroupId?: string | null;
  timeoutMs?: number;
  headers?: string | null;
  isActive: boolean;
}

interface ProxyData {
  id: string;
  url: string;
  secret: string;
  environmentId: string;
  isActive: boolean;
}

interface ProxyGroupData {
  id: string;
  proxyIds: string;
  loadBalancingStrategy: string;
  isActive: boolean;
  environmentId: string;
  servers: ProxyData[];
}

export class WebhookDelivery {
  private webhookData: WebhookMessage;
  private startTime: number;
  private env: CloudflareEnv;
  private attempts: number;
  
  constructor(webhookData: WebhookMessage, env: CloudflareEnv) {
    this.webhookData = webhookData;
    this.startTime = Date.now();
    this.env = env;
    this.attempts = 0;
  }

  async setAttempts(attempts: number) {
    this.attempts = attempts;
  }

  /**
   * Get the payload, fetching from KV if stored there
   */
  private async getPayload(): Promise<any> {
    // If payload is directly in the message, return it
    if (this.webhookData.payload !== null && this.webhookData.payload !== undefined) {
      return this.webhookData.payload;
    }

    // If payloadKey exists, fetch from KV
    if (this.webhookData.payloadKey) {
      try {
        const payloadData = await this.env.KV.get(this.webhookData.payloadKey);
        if (payloadData) {
          // Extend TTL on access to ensure it doesn't expire during retries
          await this.extendPayloadTTL();
          return JSON.parse(payloadData);
        } else {
          throw new Error(`Payload not found in KV: ${this.webhookData.payloadKey}`);
        }
      } catch (error) {
        console.error('Error fetching payload from KV:', error);
        throw new Error(`Failed to fetch payload from KV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error('No payload available in message or KV');
  }

  /**
   * Extend the TTL of a KV-stored payload to ensure it doesn't expire during retries
   */
  private async extendPayloadTTL(): Promise<void> {
    if (!this.webhookData.payloadKey) return;

    try {
      // Get the current payload data
      const payloadData = await this.env.KV.get(this.webhookData.payloadKey);
      if (payloadData) {
        // Extend TTL by 7 days to ensure it survives retry attempts
        await this.env.KV.put(this.webhookData.payloadKey, payloadData, {
          expirationTtl: 60 * 60 * 24 * 7 // 7 days
        });
        console.log(`Extended TTL for payload: ${this.webhookData.payloadKey}`);
      }
    } catch (error) {
      console.error('Error extending payload TTL:', error);
      // Don't throw - this is not critical for the main flow
    }
  }

  async send(endpointId: string): Promise<DeliveryResult> {
    try {
      const endpointData = await this.getEndpointWithCache(endpointId);
      
      if (!endpointData) {
        throw new Error(`Endpoint ${endpointId} not found`);
      }

      if (!endpointData.isActive) {
        throw new Error(`Endpoint ${endpointId} is not active`);
      }

      // Determine delivery method based on endpoint configuration
      if (endpointData.proxyGroupId) {
        return await this.sendViaProxy(endpointData);
      } else {
        return await this.sendDirect(endpointData);
      }

    } catch (error) {
      const responseTime = Date.now() - this.startTime;
      
      // Log the failed attempt
      await this.logAttempt(endpointId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        endpointId
      });

      return { 
        endpointId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime 
      };
    }
  }

  private async sendViaProxy(endpointData: EndpointData): Promise<DeliveryResult> {
    const selectedProxy = await this.selectProxy(endpointData.proxyGroupId!);
    
    if (!selectedProxy) {
      console.log(`No active proxy found for endpoint ${endpointData.id}, falling back to direct delivery`);
      return await this.sendDirect(endpointData);
    }

    const proxyRequest = this.buildProxyRequest(endpointData);
    
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

    const responseTime = Date.now() - this.startTime;
    const responseBody = await response.text();
    
    let proxyResponse;
    try {
      proxyResponse = JSON.parse(responseBody);
    } catch {
      proxyResponse = { success: false, error: 'Invalid proxy response' };
    }

    const result: DeliveryResult = {
      endpointId: endpointData.id,
      success: proxyResponse.success,
      responseTime: proxyResponse.responseTime || responseTime
    };

    if (!proxyResponse.success) {
      result.error = proxyResponse.error || `HTTP ${response.status}: ${responseBody}`;
    }

    // Log the attempt
    const payload = await this.getPayload();
    await this.logAttempt(endpointData.id, result, {
      requestUrl: endpointData.url,
      requestMethod: 'POST',
      requestHeaders: JSON.stringify(proxyRequest.headers),
      requestBody: JSON.stringify(payload),
      responseStatus: proxyResponse.status || response.status,
      responseHeaders: JSON.stringify(proxyResponse.headers || Object.fromEntries(response.headers.entries())),
      responseBody: proxyResponse.body ? JSON.stringify(proxyResponse.body) : responseBody,
      status: proxyResponse.success ? 'delivered' : 'failed',
      errorMessage: result.error
    });

    return result;
  }

  private async sendDirect(endpointData: EndpointData): Promise<DeliveryResult> {
    const headers = this.buildHeaders(endpointData);
    const payload = await this.getPayload();
    
    const response = await fetch(endpointData.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(endpointData.timeoutMs || 30000)
    });

    const responseTime = Date.now() - this.startTime;
    const responseBody = await response.text();

    const result: DeliveryResult = {
      endpointId: endpointData.id,
      success: response.ok,
      responseTime
    };

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${responseBody}`;
    }

    // Log the attempt
    await this.logAttempt(endpointData.id, result, {
      requestUrl: endpointData.url,
      requestMethod: 'POST',
      requestHeaders: JSON.stringify(headers),
      requestBody: JSON.stringify(payload),
      responseStatus: response.status,
      responseHeaders: JSON.stringify(Object.fromEntries(response.headers.entries())),
      responseBody: responseBody.length > 1000 ? responseBody.substring(0, 1000) + '...' : responseBody,
      status: response.ok ? 'delivered' : 'failed',
      errorMessage: result.error
    });

    return result;
  }

  private async selectProxy(proxyGroupId: string): Promise<ProxyData | null> {
    const proxies = await this.getProxyServersWithCache(proxyGroupId);

    if (!proxies) {
      return null;
    }

    // Select proxy based on load balancing strategy
    if (proxies.loadBalancingStrategy === 'round_robin') {
      // Simple round-robin (could be improved with state tracking)
      return proxies.servers[Math.floor(Math.random() * proxies.servers.length)];
    } else {
      // Random selection (default)
      return proxies.servers[Math.floor(Math.random() * proxies.servers.length)];
    }
  }

  private buildProxyRequest(endpointData: EndpointData) {
    return {
      targetUrl: endpointData.url,
      method: 'POST',
      headers: this.buildHeaders(endpointData),
      payload: this.webhookData.payload,
      timeout: endpointData.timeoutMs || 30000,
      idempotencyKey: this.webhookData.idempotencyKey
    };
  }

  private buildHeaders(endpointData: EndpointData): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'WebhookService/1.0',
      'X-Webhook-Event': this.webhookData.eventType,
      'X-Webhook-ID': this.webhookData.id,
    };

    if (this.webhookData.idempotencyKey) {
      headers['Idempotency-Key'] = this.webhookData.idempotencyKey;
    }

    // Add custom headers if configured
    if (endpointData.headers) {
      try {
        const customHeaders = JSON.parse(endpointData.headers);
        Object.assign(headers, customHeaders);
      } catch (error) {
        console.warn(`Invalid custom headers for endpoint ${endpointData.id}:`, error);
      }
    }

    return headers;
  }

  private async logAttempt(
    endpointId: string, 
    result: DeliveryResult, 
    additionalData?: Partial<any>
  ): Promise<void> {
    const attemptData = {
      id: crypto.randomUUID(),
      messageId: this.webhookData.id,
      endpointId,
      attemptNumber: this.attempts,
      responseTimeMs: result.responseTime,
      status: result.success ? 'delivered' : 'failed',
      errorMessage: result.error || null,
      attemptedAt: new Date(),
      completedAt: new Date(),
      requestUrl: additionalData?.requestUrl || 'unknown',
      requestMethod: additionalData?.requestMethod || 'POST',
      requestHeaders: additionalData?.requestHeaders || '{}',
      requestBody: additionalData?.requestBody || '{}',
      responseStatus: additionalData?.responseStatus || 0,
      responseHeaders: additionalData?.responseHeaders || '{}',
      responseBody: additionalData?.responseBody || '',
      ...additionalData
    };

    const db = await this.getDb(this.env);
    await db.insert(webhookAttempts).values(attemptData);
  }

  private async getEndpointWithCache(endpointId: string): Promise<EndpointData | null> {
    // Attempt to get from KV first
    const endpointRaw = await this.env.KV.get(endpointId);
    if (endpointRaw) {
      return JSON.parse(endpointRaw) as EndpointData;
    }

    const db = await this.getDb(this.env);
    const endpoint = await db
      .select()
      .from(endpoints)
      .where(eq(endpoints.id, endpointId))
      .limit(1);

    if (endpoint && endpoint[0]) {
      await this.env.KV.put(endpointId, JSON.stringify(endpoint[0]));
      return endpoint[0];
    }

    return null;
  }

  private async getProxyServersWithCache(proxyGroupId: string): Promise<ProxyGroupData | null> {
    const proxyServersRaw = await this.env.KV.get(proxyGroupId);
    if (proxyServersRaw) {
      return JSON.parse(proxyServersRaw) as ProxyGroupData;
    }

    const db = await this.getDb(this.env);

    const proxyGroup = await db
      .select()
      .from(proxyGroups)
      .where(eq(proxyGroups.id, proxyGroupId))
      .limit(1);

    if (!proxyGroup[0] || !proxyGroup[0].isActive) {
      return null;
    }

    const proxyIds = JSON.parse(proxyGroup[0].proxyIds);
    
    if (proxyIds.length === 0) {
      return null;
    }

    // Get active proxy servers
    const proxies = await db
      .select()
      .from(proxyServers)
      .where(
        and(
          eq(proxyServers.environmentId, proxyGroup[0].environmentId),
          eq(proxyServers.isActive, true)
        )
      );

    const groupProxies = proxies.filter((proxy: ProxyData) => proxyIds.includes(proxy.id));
    
    if (groupProxies.length === 0) {
      return null;
    }

    if (groupProxies && groupProxies[0]) {
      await this.env.KV.put(proxyGroupId, JSON.stringify(groupProxies));
      return {
        id: proxyGroupId,
        proxyIds: proxyIds,
        loadBalancingStrategy: proxyGroup[0].loadBalancingStrategy,
        isActive: proxyGroup[0].isActive,
        environmentId: proxyGroup[0].environmentId,
        servers: groupProxies
      };
    }

    return null;
  }

  private async getDb(env: CloudflareEnv) {
    return drizzle(env.DATABASE, {
        schema,
    });
  }
}

// Export types for use in other files
export type { WebhookMessage, DeliveryResult, EndpointData, ProxyData, ProxyGroupData };
