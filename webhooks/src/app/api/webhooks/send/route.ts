import { checkApiKeyPermission, extractApiKeyFromHeader } from "@/lib/apiKeyAuth";
import { getDb } from "@/db";
import { webhookMessages } from "@/db/webhooks.schema";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// POST /webhooks/send - Send webhook (add to queue)
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
    const { endpointIds, endpointGroups, eventType, eventId, payload, logPayload } = body as { 
        endpointIds?: string[]; 
        endpointGroups?: string[]; 
        eventType: string; 
        payload: any; 
        eventId?: string;
        logPayload?: boolean;
    };
    const idempotencyKey = request.headers.get("Idempotency-Key");

    // Request must have endpointId and/or endpointGroup
    if (!endpointIds && !endpointGroups) {
      return NextResponse.json({ error: "Endpoint ID or endpoint groups is required" }, { status: 400 });
    }

    // Request must have eventType
    if (!eventType) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 });
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

    if ([endpointIds, endpointGroups].some(ids => ids?.some(id => !id.startsWith(environmentId)))) {
      return NextResponse.json({ 
        error: "Forbidden",
        message: "API key does not have permissions on all endpointIds and/or endpointGroups"
      }, { status: 403 });
    }

    // Validate that the endpointIds and endpointGroups are in the environment

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
