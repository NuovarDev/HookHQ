import { getDb } from "@/db";
import { endpointGroups, endpoints, eventTypes, webhookMessages } from "@/db/webhooks.schema";
import { cacheEndpointData } from "@/lib/cacheUtils";
import { createRetryConfig } from "@/lib/retryUtils";
import { validateEventPayload } from "@/lib/schemaValidation";
import { and, eq, inArray } from "drizzle-orm";

type SendWebhookBody = {
  destinations?: string[];
  eventType?: string;
  payload?: unknown;
  eventId?: string;
  logPayload?: boolean;
};

type HandleSendWebhookRequestInput = {
  body: unknown;
  env: CloudflareEnv;
  request: Request;
  environmentId: string;
};

export async function handleSendWebhookRequest({
  body,
  env,
  request,
  environmentId,
}: HandleSendWebhookRequestInput): Promise<Response> {
  const { destinations, eventType, eventId, payload, logPayload } = (body ?? {}) as SendWebhookBody;

  if (!destinations || payload === undefined) {
    return Response.json(
      {
        error: `${!destinations ? "Destinations are" : "Payload is"} required`,
      },
      { status: 400 }
    );
  }

  const endpointGroupIds = destinations.filter(destination => destination.startsWith("grp_"));
  const endpointIds = destinations.filter(destination => !destination.startsWith("grp_"));

  if (endpointGroupIds.length > 0 && !eventType) {
    return Response.json({ error: "eventType must be specified when endpointGroups are provided" }, { status: 400 });
  }

  if (
    [endpointIds, endpointGroupIds].some(ids =>
      ids.some(id => !(id.startsWith(`ep_${environmentId}_`) || id.startsWith(`grp_${environmentId}_`)))
    )
  ) {
    return Response.json(
      {
        error: "Forbidden",
        message: "API key does not have permissions on all endpoints",
      },
      { status: 403 }
    );
  }

  const db = await getDb(env);

  if (eventType) {
    const eventTypeRecord = await db
      .select({ schema: eventTypes.schema })
      .from(eventTypes)
      .where(and(eq(eventTypes.name, eventType), eq(eventTypes.environmentId, environmentId)))
      .limit(1);

    if (eventTypeRecord.length > 0 && eventTypeRecord[0].schema) {
      const validation = validateEventPayload(eventTypeRecord[0].schema, payload);

      if (!validation.valid) {
        return Response.json(
          {
            error: "Payload validation failed",
            details: validation.errors,
          },
          { status: 400 }
        );
      }
    }
  }

  const date = new Date();
  const webhookId = crypto.randomUUID();
  const idempotencyKey = request.headers.get("Idempotency-Key");

  await db.insert(webhookMessages).values({
    id: webhookId,
    eventId,
    eventType,
    environmentId,
    endpointIds: JSON.stringify(endpointIds),
    endpointGroupIds: JSON.stringify(endpointGroupIds),
    payload: logPayload ? JSON.stringify(payload) : null,
    payloadSize: JSON.stringify(payload).length,
    status: "pending",
    attempts: 0,
    maxAttempts: 3,
    createdAt: date,
    queuedAt: date,
    idempotencyKey,
  });

  const resolvedEndpoints = await resolveEndpointGroups({
    endpointGroupIds,
    eventType,
    environmentId,
    env,
  });
  const allEndpointIds = [...endpointIds, ...resolvedEndpoints];

  if (allEndpointIds.length === 0) {
    return Response.json({ error: "No endpoints found" }, { status: 400 });
  }

  const endpointData = await cacheEndpointData(allEndpointIds, environmentId, env);
  const endpointMap = new Map(endpointData.map(endpoint => [endpoint.id, endpoint]));
  const endpointMessages: MessageSendRequest[] = [];

  const payloadSize = JSON.stringify(payload).length;
  const shouldUseKV = payloadSize / 1024 > 64 || allEndpointIds.length > 50;
  let payloadKey: string | null = shouldUseKV ? `webhook-payload:${webhookId}` : null;
  let maxRetryPeriodDays = 7;

  const baseMessageBody = {
    id: webhookId,
    eventType,
    eventId,
    timestamp: date.toISOString(),
    idempotencyKey,
    payloadKey,
    payload: shouldUseKV ? null : payload,
  };

  const baseMessageSize = JSON.stringify(baseMessageBody).length;
  let optimalBatchSize = Math.floor((256 * 1024) / baseMessageSize);
  optimalBatchSize = Math.min(optimalBatchSize, 100);

  for (const endpointId of allEndpointIds) {
    const endpoint = endpointMap.get(endpointId);
    const retryConfig = await createRetryConfig(
      endpoint?.retryPolicy || "retry",
      endpoint?.maxRetries || 3,
      endpoint?.backoffStrategy || "exponential",
      endpoint?.baseDelaySeconds || 500,
      env
    );

    if (shouldUseKV) {
      maxRetryPeriodDays = Math.max(
        maxRetryPeriodDays,
        getRetryPeriodDays(retryConfig.maxAttempts, retryConfig.baseDelaySeconds, retryConfig.backoffStrategy)
      );
    }

    endpointMessages.push({
      body: {
        ...baseMessageBody,
        endpointId,
        retryConfig,
      },
    });
  }

  if (shouldUseKV && payloadKey) {
    maxRetryPeriodDays = Math.max(3, Math.min(30, maxRetryPeriodDays));
    await env.KV.put(payloadKey, JSON.stringify(payload), {
      expirationTtl: 60 * 60 * 24 * maxRetryPeriodDays,
    });
  }

  const batches = Math.ceil(endpointMessages.length / optimalBatchSize);

  for (let index = 0; index < batches; index++) {
    const batch = endpointMessages.slice(index * optimalBatchSize, (index + 1) * optimalBatchSize);
    await env.WEBHOOKS.sendBatch(batch as Iterable<MessageSendRequest<Body>>);
  }

  return Response.json({
    id: webhookId,
    eventId,
    eventType,
    payload,
    channels: [...endpointIds, ...endpointGroupIds],
    timestamp: date.toISOString(),
  });
}

async function resolveEndpointGroups({
  endpointGroupIds,
  eventType,
  environmentId,
  env,
}: {
  endpointGroupIds: string[];
  eventType?: string;
  environmentId: string;
  env: CloudflareEnv;
}): Promise<string[]> {
  if (endpointGroupIds.length === 0 || !eventType) {
    return [];
  }

  const db = await getDb(env);
  const resolvedEndpoints: string[] = [];

  for (const groupId of endpointGroupIds) {
    const cacheKey = `group:${groupId}:${eventType}`;
    const cachedResult = await env.KV.get(cacheKey);

    if (cachedResult) {
      resolvedEndpoints.push(...JSON.parse(cachedResult));
      continue;
    }

    const group = await db
      .select()
      .from(endpointGroups)
      .where(
        and(
          eq(endpointGroups.id, groupId),
          eq(endpointGroups.environmentId, environmentId),
          eq(endpointGroups.isActive, true)
        )
      )
      .limit(1);

    if (!group[0]) {
      await env.KV.put(cacheKey, JSON.stringify([]), { expirationTtl: 60 * 60 * 24 * 30 });
      continue;
    }

    const groupEndpointIds = JSON.parse(group[0].endpointIds);

    if (groupEndpointIds.length === 0) {
      await env.KV.put(cacheKey, JSON.stringify([]), { expirationTtl: 60 * 60 * 24 * 30 });
      continue;
    }

    const subscribedEndpoints = await db
      .select()
      .from(endpoints)
      .where(
        and(
          eq(endpoints.environmentId, environmentId),
          eq(endpoints.isActive, true),
          inArray(endpoints.id, groupEndpointIds)
        )
      );

    const groupResolvedEndpoints = subscribedEndpoints
      .filter(endpoint => JSON.parse(endpoint.topics || "[]").includes(eventType))
      .map(endpoint => endpoint.id);

    await env.KV.put(cacheKey, JSON.stringify(groupResolvedEndpoints), {
      expirationTtl: 60 * 60 * 24 * 30,
    });

    resolvedEndpoints.push(...groupResolvedEndpoints);
  }

  return resolvedEndpoints;
}

function getRetryPeriodDays(
  maxAttempts: number,
  baseDelaySeconds: number,
  backoffStrategy: "exponential" | "linear" | "fixed"
): number {
  let maxRetrySeconds = 0;

  for (let attempt = 1; attempt < maxAttempts; attempt++) {
    let delaySeconds = 0;

    switch (backoffStrategy) {
      case "exponential":
        delaySeconds = Math.min(baseDelaySeconds * 2 ** (attempt - 1), 300);
        break;
      case "linear":
        delaySeconds = Math.min(baseDelaySeconds * attempt, 300);
        break;
      case "fixed":
        delaySeconds = baseDelaySeconds;
        break;
    }

    maxRetrySeconds += delaySeconds;
  }

  return Math.ceil(maxRetrySeconds / (24 * 60 * 60));
}
