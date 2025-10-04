import { checkApiKeyPermission, extractApiKeyFromHeader } from "@/lib/apiKeyAuth";
import { getDb } from "@/db";
import { webhookMessages, eventTypes } from "@/db/webhooks.schema";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateApiRequest } from "@/lib/apiHelpers";
import { validateEventPayload } from "@/lib/schemaValidation";
import { eq, and } from "drizzle-orm";

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
 *        API key requires the `messages:create` permission to access this endpoint.
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

    const { env } = await getCloudflareContext({ async: true });

    const { destinations, eventType, eventId, payload, logPayload } = body as { 
        destinations?: string[]; 
        eventType: string; 
        payload: any; 
        eventId?: string;
        logPayload?: boolean;
    };
    const idempotencyKey = request.headers.get("Idempotency-Key");

    // Request must have endpointId and/or endpointGroup
    if (!destinations) {
      return NextResponse.json({ error: "Destinations are required" }, { status: 400 });
    }

    // Check if any endpoints are endpointGroups
    const endpointGroups = destinations.filter(destination => destination.startsWith("grp_"));
    const endpointIds = destinations.filter(destination => !destination.startsWith("grp_"));

    // If endpointGroup is provided, eventType is required
    if (endpointGroups.length > 0 && !eventType) {
      return NextResponse.json({ error: "eventType must be specified when endpointGroups are provided" }, { status: 400 });
    }

    // Request must have payload
    if (!payload) {
      return NextResponse.json({ error: "Payload is required" }, { status: 400 });
    }

    if (!environmentId) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if ([endpointIds, endpointGroups].some(ids => ids?.some(id => !(id.startsWith(`ep_${environmentId}_`) || id.startsWith(`grp_${environmentId}_`))))) {
      return NextResponse.json({ 
        error: "Forbidden",
        message: "API key does not have permissions on all endpoints"
      }, { status: 403 });
    }

    // Validate payload against event type schema if eventType is provided
    if (eventType) {
      const db = await getDb();
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

    const date = new Date();

    // If eventId was provided, use it, otherwise generate a new one
    const webhookId = crypto.randomUUID();

    // Save to database for tracking
    const db = await getDb();
    const payloadSize = payload ? JSON.stringify(payload).length : 0;
    
    await db.insert(webhookMessages).values({
      id: webhookId,
      eventId,
      eventType,
      environmentId,
      endpointIds: JSON.stringify(endpointIds || []),
      endpointGroupIds: JSON.stringify(endpointGroups || []),
      payload: logPayload ? JSON.stringify(payload) : null,
      payloadSize,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      createdAt: date,
      queuedAt: date,
      idempotencyKey,
    });

    // Add to queue
    await env.WEBHOOKS.send({
      id: webhookId,
      endpointIds: endpointIds || [],
      endpointGroups: endpointGroups || [],
      eventType,
      eventId,
      payload,
      timestamp: date.toISOString(),
      idempotencyKey
    });

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
