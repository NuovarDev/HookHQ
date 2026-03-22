import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import {
  authHeaderSchema,
  errorResponseSchema,
  messageRetryParamSchema,
  retryResponseSchema,
} from "@/lib/publicApi/schemas";
import { jsonError, requireEnvironmentAccess } from "@/lib/publicApi/utils";

const retryMessageRoute = createRoute({
  method: "post",
  path: "/messages/{messageId}/{endpointId}/retry",
  tags: ["Messages"],
  summary: "Retry Failed Message",
  request: { headers: authHeaderSchema, params: messageRetryParamSchema },
  responses: {
    200: { description: "Success", content: { "application/json": { schema: retryResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
    500: { description: "Internal Server Error", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

export function registerMessageRoutes(app: OpenAPIHono<{ Bindings: CloudflareEnv }>) {
  app.openapi(retryMessageRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { messages: ["create"] },
    });
    if (auth instanceof Response) return auth;
    const { messageId, endpointId } = c.req.valid("param");
    const key = `failed:${messageId}:${endpointId}`;
    const failedMessageRaw = await c.env.KV.get(key);
    if (!failedMessageRaw) return jsonError("Failed message not found or expired", 404);
    const failedMessageData = JSON.parse(failedMessageRaw);
    const { webhookData } = failedMessageData;
    const retryWebhookId = crypto.randomUUID();
    await c.env.WEBHOOKS.send({
      id: retryWebhookId,
      endpointId: webhookData.endpointId,
      eventType: webhookData.eventType,
      eventId: webhookData.eventId,
      payload: webhookData.payload,
      timestamp: new Date().toISOString(),
      idempotencyKey: webhookData.idempotencyKey,
      retryConfig: webhookData.retryConfig,
      isManualRetry: true,
      originalMessageId: messageId,
    });
    await c.env.KV.delete(key);
    return c.json(
      {
        message: "Message queued for retry successfully",
        retryId: retryWebhookId,
        originalMessageId: messageId,
        endpointId,
      },
      200
    );
  }) as never);
}
