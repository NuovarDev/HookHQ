import { getDb } from "@/db";
import { webhookMessages, eventTypes, endpoints, endpointGroups } from "@/db/webhooks.schema";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateApiRequest } from "@/lib/apiHelpers";
import { eq, and, inArray } from "drizzle-orm";
import { cacheEndpointData } from "@/lib/cacheUtils";
import { createRetryConfig } from "@/lib/retryUtils";

/**
 * @swagger
 * /send:
 *   post:
 *     summary: Send Event
 *     description: |
 *       Send an event to the specified endpoints.
 * 
 *        Events can be sent to endpoints and/or endpoint groups. 
 *        In order to send an event to an endpoint group, the eventType must be specified, then the event will be dispatched to all endpoints in the group that are subscribed to the eventType.
 * 
 *        API key requires the `webhooks:send` permission to access this endpoint.
 *     tags:
 *       - Send
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["payload", "destinations"]
 *             properties:
 *               destinations:
 *                 description: List of endpoints or endpoint groups to send the event to
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - ep_a1b2_abcd1234
 *                   - grp_a1b2_efgh5678
 *               eventType:
 *                 description: Event type to send the event to. Required if sending to an endpoint group.
 *                 type: string
 *                 example:
 *                   user.created
 *               payload:
 *                 description: Payload to send with the event
 *                 type: object
 *                 example:
 *                   { userId: "abcd1234" }
 *               eventId:
 *                 description: Optional unique event ID to track the event
 *                 type: string
 *                 example:
 *                   abcdef1234567890
 *     parameters:
 *       - name: Idempotency-Key
 *         in: header
 *         required: false
 *         description: Optional idempotency key
 *         schema:
 *           type: string
 *         example:
 *           1234567890
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique server generated event ID
 *                 eventId:
 *                   type: string
 *                   description: Tracking ID provided in the request
 *                 eventType:
 *                   type: string
 *                   description: Event type
 *                 payload:
 *                   type: object
 *                   description: Payload
 *                 channels:
 *                   type: array
 *                   description: Channels the webhook was sent to
 *                   items:
 *                     type: string
 *                     description: Channel ID
 *                 timestamp:
 *                   type: string
 *                   description: Timestamp the webhook was sent
 *               example:
 *                 id: abcdef1234567890
 *                 eventId: abcdef1234567890
 *                 eventType: user.created
 *                 payload: { userId: abcd1234 }
 *                 channels: [ "ep_a1b2_abcd1234", "grp_a1b2_efgh5678" ]
 *                 timestamp: 2021-01-01T00:00:00.000Z
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Bad request"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Forbidden"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *                error: "Internal server error"
 *     x-speakeasy-name-override: "send"
 */
export async function POST(request: NextRequest) {
    const authResult = await authenticateApiRequest(request, { messages: ["create"] });
    
    if (!authResult.success) {
      return authResult.response;
    }
    
    const { environmentId, body } = authResult;
    const { destinations, eventType, eventId, payload, logPayload } = body as { 
        destinations?: string[]; 
        eventType: string; 
        payload: any; 
        eventId?: string;
        logPayload?: boolean;
    };

    // Request must have endpointId and/or endpointGroup
    if (!destinations || !payload) {
      return NextResponse.json({ 
        error: `${!destinations ? "Destinations are" : "Payload is"} required`
      }, { status: 400 });
    }

    // Check if any endpoints are endpointGroups
    const endpointGroups = destinations.filter(destination => destination.startsWith("grp_"));
    const endpointIds = destinations.filter(destination => !destination.startsWith("grp_"));

    // If endpointGroup is provided, eventType is required
    if (endpointGroups.length > 0 && !eventType) {
      return NextResponse.json({ error: "eventType must be specified when endpointGroups are provided" }, { status: 400 });
    }

    if ([endpointIds, endpointGroups].some(ids => ids?.some(id => !(id.startsWith(`ep_${environmentId}_`) || id.startsWith(`grp_${environmentId}_`))))) {
      return NextResponse.json({ 
        error: "Forbidden",
        message: "API key does not have permissions on all endpoints"
      }, { status: 403 });
    }

    const db = await getDb();

    // Validate payload against event type schema if eventType is provided
    if (eventType) {
      const { validateEventPayload } = await import("@/lib/schemaValidation");
      const eventTypeRecord = await db
        .select({ schema: eventTypes.schema })
        .from(eventTypes)
        .where(and(
          eq(eventTypes.name, eventType),
          eq(eventTypes.environmentId, environmentId)
        ))
        .limit(1);

      if (eventTypeRecord.length > 0 && eventTypeRecord[0].schema) {
        const validation = validateEventPayload(eventTypeRecord[0].schema, payload);
        if (!validation.valid) {
          return NextResponse.json({ 
            error: "Payload validation failed", 
            details: validation.errors 
          }, { status: 400 });
        }
      }
    }

    // TO-DO: Enforce unique eventId

    // If eventId was provided, use it, otherwise generate a new one
    const date = new Date();
    const webhookId = crypto.randomUUID();
    const idempotencyKey = request.headers.get("Idempotency-Key");

    await db.insert(webhookMessages).values({
      id: webhookId,
      eventId,
      eventType,
      environmentId,
      endpointIds: JSON.stringify(endpointIds || []),
      endpointGroupIds: JSON.stringify(endpointGroups || []),
      payload: logPayload ? JSON.stringify(payload) : null,
      payloadSize: payload ? JSON.stringify(payload).length : 0,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      createdAt: date,
      queuedAt: date,
      idempotencyKey,
    });

    // Add to queue - send individual messages for each endpoint
    const { env } = await getCloudflareContext({ async: true });
    
    // Resolve endpoint groups to individual endpoints
    const resolvedEndpoints = await resolveEndpointGroups(endpointGroups || [], eventType, environmentId, env);
    const allEndpointIds = [...(endpointIds || []), ...resolvedEndpoints];

    if (allEndpointIds.length === 0) {
      return NextResponse.json({
        error: "No endpoints found"
      }, { status: 400 });
    }
    
    // Cache endpoint data in KV for faster consumer processing and get the data
    const endpointData = await cacheEndpointData(allEndpointIds, environmentId, env);
    
    // Prepare all endpoint messages with retry configuration
    const endpointMessages = [] as MessageSendRequest[];
    
    // Create endpoint data map for quick lookup
    const endpointMap = new Map(endpointData.map(ep => [ep.id, ep]));

    // Calculate payload size to determine storage strategy
    const payloadSize = JSON.stringify(payload).length;
    const payloadSizeKB = payloadSize / 1024;
    
    // Determine if we should store payload in KV
    // Use KV if payload is > 64KB or if we have many endpoints (risk of hitting 256KB batch limit)
    const shouldUseKV = payloadSizeKB > 64 || allEndpointIds.length > 50;
    
    let payloadKey: string | null = null;
    let maxRetryPeriodDays = 7; // Default to 7 days
    
    if (shouldUseKV) {
      payloadKey = `webhook-payload:${webhookId}`;
    }
    
    // Create base message body (without payload)
    const baseMessageBody = {
      id: webhookId,
      eventType,
      eventId,
      timestamp: date.toISOString(),
      idempotencyKey,
      payloadKey, // Include KV key if using KV storage
      payload: shouldUseKV ? null : payload, // Only include payload if not using KV
    };
    
    // Calculate optimal batch size based on message size
    const baseMessageSize = JSON.stringify(baseMessageBody).length;
    const maxBatchSize = 100; // Cloudflare's limit
    const maxBatchBytes = 256 * 1024; // 256KB limit
    
    // Calculate how many messages we can fit in a batch
    let optimalBatchSize = Math.floor(maxBatchBytes / baseMessageSize);
    optimalBatchSize = Math.min(optimalBatchSize, maxBatchSize);
    
    // Add messages for all resolved endpoints and calculate max retry period
    for (const endpointId of allEndpointIds) {
      const endpoint = endpointMap.get(endpointId);
      
      // Create retry configuration for this endpoint
      const retryConfig = await createRetryConfig(
        endpoint?.retryPolicy || "retry",
        endpoint?.maxRetries || 3,
        endpoint?.backoffStrategy || "exponential",
        endpoint?.baseDelaySeconds || 500,
      );
      
      // Calculate maximum retry period for this endpoint (if using KV)
      if (shouldUseKV) {
        const maxRetries = retryConfig.maxAttempts;
        const baseDelaySeconds = retryConfig.baseDelaySeconds;
        const backoffStrategy = retryConfig.backoffStrategy;
        
        let maxRetrySeconds = 0;
        
        // Calculate total retry time based on backoff strategy
        for (let attempt = 1; attempt < maxRetries; attempt++) {
          let delaySeconds = 0;
          
          switch (backoffStrategy) {
            case "exponential":
              delaySeconds = Math.min(baseDelaySeconds * Math.pow(2, attempt - 1), 300); // Cap at 5 minutes
              break;
            case "linear":
              delaySeconds = Math.min(baseDelaySeconds * attempt, 300); // Cap at 5 minutes
              break;
            case "fixed":
              delaySeconds = baseDelaySeconds;
              break;
          }
          
          maxRetrySeconds += delaySeconds;
        }
        
        // Convert to days and find the maximum
        const retryDays = Math.ceil(maxRetrySeconds / (24 * 60 * 60));
        maxRetryPeriodDays = Math.max(maxRetryPeriodDays, retryDays);
      }
      
      endpointMessages.push({
        body: {
          ...baseMessageBody,
          endpointId,
          retryConfig
        }
      });
    }
    
    // Store payload in KV after calculating retry periods
    if (shouldUseKV && payloadKey) {
      // Ensure minimum of 3 days, maximum of 30 days
      maxRetryPeriodDays = Math.max(3, Math.min(30, maxRetryPeriodDays));
      
      await env.KV.put(payloadKey, JSON.stringify(payload), {
        expirationTtl: 60 * 60 * 24 * maxRetryPeriodDays
      });
    }
    
    // Send messages in optimal batches
    const batches = Math.ceil(endpointMessages.length / optimalBatchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = endpointMessages.slice(i * optimalBatchSize, (i + 1) * optimalBatchSize);
      await env.WEBHOOKS.sendBatch(batch as Iterable<MessageSendRequest<Body>>);
    }

    return NextResponse.json({
      id: webhookId,
      eventId,
      eventType,
      payload,
      channels: [
        ...(endpointIds || []),
        ...(endpointGroups || []),
      ],
      timestamp: date.toISOString(),
    });
}

// Helper function to resolve endpoint groups to individual endpoints
async function resolveEndpointGroups(
  endpointGroupIds: string[], 
  eventType: string, 
  environmentId: string,
  env: CloudflareEnv
): Promise<string[]> {
  if (endpointGroupIds.length === 0) {
    return [];
  }

  const resolvedEndpoints: string[] = [];

  for (const groupId of endpointGroupIds) {
    // Try to get from cache first
    const cacheKey = `group:${groupId}:${eventType}`;
    const cachedResult = await env.KV.get(cacheKey);
    
    if (cachedResult) {
      const cachedEndpoints = JSON.parse(cachedResult);
      resolvedEndpoints.push(...cachedEndpoints);
      continue;
    }

    // Cache miss - resolve from database
    const db = await getDb();
    const group = await db
      .select()
      .from(endpointGroups)
      .where(and(
        eq(endpointGroups.id, groupId),
        eq(endpointGroups.environmentId, environmentId),
        eq(endpointGroups.isActive, true)
      ))
      .limit(1);

    if (!group[0]) {
      // Group not found or inactive - cache empty result
      await env.KV.put(cacheKey, JSON.stringify([]), { expirationTtl: 60 * 60 * 24 * 30 }); // 30 days
      continue;
    }

    const groupEndpointIds = JSON.parse(group[0].endpointIds);
    
    if (groupEndpointIds.length === 0) {
      // No endpoints in group - cache empty result
      await env.KV.put(cacheKey, JSON.stringify([]), { expirationTtl: 60 * 60 * 24 * 30 }); // 30 days
      continue;
    }

    // Get endpoints that subscribe to the event type
    const subscribedEndpoints = await db
      .select()
      .from(endpoints)
      .where(and(
        eq(endpoints.environmentId, environmentId),
        eq(endpoints.isActive, true),
        inArray(endpoints.id, groupEndpointIds)
      ));

    // Filter endpoints that subscribe to this event type
    const groupResolvedEndpoints: string[] = [];
    for (const endpoint of subscribedEndpoints) {
      const topics = JSON.parse(endpoint.topics || '[]');
      if (topics.includes(eventType)) {
        groupResolvedEndpoints.push(endpoint.id);
      }
    }

    // Cache the result
    await env.KV.put(cacheKey, JSON.stringify(groupResolvedEndpoints), { expirationTtl: 60 * 60 * 24 * 30 }); // 30 days
    
    resolvedEndpoints.push(...groupResolvedEndpoints);
  }

  return resolvedEndpoints;
}

