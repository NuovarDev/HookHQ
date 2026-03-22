import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { endpoints } from "@/db/webhooks.schema";
import { invalidateEndpointCache } from "@/lib/cacheUtils";
import {
  authHeaderSchema,
  deleteResponseSchema,
  endpointSchema,
  endpointUpdateSchema,
  errorResponseSchema,
  idParamSchema,
} from "@/lib/publicApi/schemas";
import { jsonError, requireEnvironmentAccess } from "@/lib/publicApi/utils";

function formatEndpoint(endpoint: typeof endpoints.$inferSelect) {
  return {
    id: endpoint.id,
    environmentId: endpoint.environmentId,
    name: endpoint.name,
    description: endpoint.description,
    url: endpoint.url,
    enabled: endpoint.isActive,
    retryPolicy: endpoint.retryPolicy,
    maxAttempts: endpoint.maxRetries,
    timeoutMs: endpoint.timeoutMs,
    customHeaders: endpoint.headers ? JSON.parse(endpoint.headers) : {},
    proxyGroupId: endpoint.proxyGroupId,
    createdAt: endpoint.createdAt.toISOString(),
    updatedAt: endpoint.updatedAt.toISOString(),
  };
}

const getEndpointRoute = createRoute({
  method: "get",
  path: "/endpoints/{id}",
  tags: ["Endpoints"],
  summary: "Get Endpoint",
  request: { headers: authHeaderSchema, params: idParamSchema },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: z.object({ endpoint: endpointSchema }) } },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

const deleteEndpointRoute = createRoute({
  method: "delete",
  path: "/endpoints/{id}",
  tags: ["Endpoints"],
  summary: "Delete Endpoint",
  request: { headers: authHeaderSchema, params: idParamSchema },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: deleteResponseSchema.extend({
            deletedEndpoint: z.object({ id: z.string(), name: z.string() }),
          }),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

const updateEndpointRoute = createRoute({
  method: "patch",
  path: "/endpoints/{id}",
  tags: ["Endpoints"],
  summary: "Update Endpoint",
  request: {
    headers: authHeaderSchema,
    params: idParamSchema,
    body: { required: true, content: { "application/json": { schema: endpointUpdateSchema } } },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z.object({ message: z.string(), endpoint: endpointSchema }),
        },
      },
    },
    400: { description: "Bad Request", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

export function registerEndpointItemRoutes(app: OpenAPIHono<{ Bindings: CloudflareEnv }>) {
  app.openapi(getEndpointRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpoints: ["read"] },
    });
    if (auth instanceof Response) return auth;
    const { id } = c.req.valid("param");
    const db = await getDb(c.env);
    const endpoint = await db.select().from(endpoints).where(eq(endpoints.id, id)).limit(1);
    if (endpoint.length === 0) return jsonError("Endpoint not found", 404);
    return c.json({ endpoint: formatEndpoint(endpoint[0]) }, 200);
  }) as never);

  app.openapi(deleteEndpointRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpoints: ["delete"] },
    });
    if (auth instanceof Response) return auth;
    const { id } = c.req.valid("param");
    const db = await getDb(c.env);
    const endpoint = await db.select().from(endpoints).where(eq(endpoints.id, id)).limit(1);
    if (endpoint.length === 0) return jsonError("Endpoint not found", 404);
    await db.delete(endpoints).where(eq(endpoints.id, id));
    await invalidateEndpointCache(id);
    return c.json(
      { message: "Endpoint deleted successfully", deletedEndpoint: { id: endpoint[0].id, name: endpoint[0].name } },
      200
    );
  }) as never);

  app.openapi(updateEndpointRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpoints: ["update"] },
    });
    if (auth instanceof Response) return auth;
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = await getDb(c.env);
    const existing = await db.select().from(endpoints).where(eq(endpoints.id, id)).limit(1);
    if (existing.length === 0) return jsonError("Endpoint not found", 404);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.enabled !== undefined) updateData.isActive = body.enabled;
    if (body.retryPolicy !== undefined) updateData.retryPolicy = body.retryPolicy;
    if (body.maxAttempts !== undefined) updateData.maxRetries = body.maxAttempts;
    if (body.timeoutMs !== undefined) updateData.timeoutMs = body.timeoutMs;
    if (body.customHeaders !== undefined) updateData.headers = JSON.stringify(body.customHeaders);
    if (body.proxyGroupId !== undefined) updateData.proxyGroupId = body.proxyGroupId;
    await db
      .update(endpoints)
      .set(updateData as never)
      .where(eq(endpoints.id, id));
    await invalidateEndpointCache(id);
    const updated = await db.select().from(endpoints).where(eq(endpoints.id, id)).limit(1);
    return c.json({ message: "Endpoint updated successfully", endpoint: formatEndpoint(updated[0]) }, 200);
  }) as never);
}
