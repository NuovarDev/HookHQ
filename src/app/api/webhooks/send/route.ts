import { checkApiKeyPermission, extractApiKeyFromHeader } from "@/lib/apiKeyAuth";
import { getDb } from "@/db";
import { webhookMessages } from "@/db/webhooks.schema";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * @swagger
 * /webhooks/send:
 *   post:
 *     description: |
 *       Send a webhook to the specified endpoints.
 * 
 *        Webhooks can be sent to endpoints and/or endpoint groups. 
 *        In order to send a webhook to an endpoint group, the eventType must be specified, then the webhook will be dispatched to all endpoints in the group that are subscribed to the eventType.
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpoints:
 *                 description: List of endpoints or endpoint groups to send the webhook to
 *                 type: array
 *                 required: true
 *                 items:
 *                   type: string
 *                 example:
 *                   - ep_a1b2_abcd1234
 *                   - grp_a1b2_efgh5678
 *               eventType:
 *                 description: Event type to send the webhook to. Required if sending to an endpoint group.
 *                 type: string
 *                 required: false
 *                 example:
 *                   user.created
 *               payload:
 *                 description: Payload to send with the webhook
 *                 type: object
 *                 required: true
 *                 example:
 *                   { userId: "abcd1234" }
 *               eventId:
 *                 description: Optional unique event ID to track the webhook
 *                 type: string
 *                 required: false
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhook sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    // Authenticate request via API key, must have messages:create, or all_permissions
    const apiKey = extractApiKeyFromHeader(request.headers.get("Authorization"))

    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeyPermissions = await checkApiKeyPermission(apiKey, "messages:create");
    if (!apiKeyPermissions.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoints, eventType, eventId, payload, logPayload } = body as { 
        endpoints?: string[]; 
        eventType: string; 
        payload: any; 
        eventId?: string;
        logPayload?: boolean;
    };
    const idempotencyKey = request.headers.get("Idempotency-Key");

    // Request must have endpointId and/or endpointGroup
    if (!endpoints) {
      return NextResponse.json({ error: "Endpoints are required" }, { status: 400 });
    }

    // Check if any endpoints are endpointGroups
    const endpointGroups = endpoints.filter(endpoint => endpoint.startsWith("grp_"));
    const endpointIds = endpoints.filter(endpoint => !endpoint.startsWith("grp_"));

    // If endpointGroup is provided, eventType is required
    if (endpointGroups.length > 0 && !eventType) {
      return NextResponse.json({ error: "eventType must be specified when endpointGroups are provided" }, { status: 400 });
    }

    // Request must have payload
    if (!payload) {
      return NextResponse.json({ error: "Payload is required" }, { status: 400 });
    }

    // TO-DO: Validate that API key has permissions on the endpointIds and/or endpointGroups
    // We embed the environment id in the endpointIds and endpointGroups, so get the environment id from the API key
    const environmentId = apiKeyPermissions.metadata?.environment;

    if (!environmentId) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    if ([endpointIds, endpointGroups].some(ids => ids?.some(id => !(id.startsWith(`ep_${environmentId}_`) || id.startsWith(`grp_${environmentId}_`))))) {
      return NextResponse.json({ 
        error: "Forbidden",
        message: "API key does not have permissions on all endpoints"
      }, { status: 403 });
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
  } catch (error) {
    console.error("Error sending webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
