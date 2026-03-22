import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { endpoints } from "@/db/webhooks.schema";
import {
  authHeaderSchema,
  enabledQuerySchema,
  endpointCreateSchema,
  endpointSchema,
  errorResponseSchema,
} from "@/lib/publicApi/schemas";
import { parseEnabledFilter, requireEnvironmentAccess } from "@/lib/publicApi/utils";

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

const listEndpointsRoute = createRoute({
  method: "get",
  path: "/endpoints",
  tags: ["Endpoints"],
  summary: "List Endpoints",
  request: {
    headers: authHeaderSchema,
    query: enabledQuerySchema,
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z.object({ endpoints: z.array(endpointSchema) }),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    429: { description: "Rate limited", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

const createEndpointRoute = createRoute({
  method: "post",
  path: "/endpoints",
  tags: ["Endpoints"],
  summary: "Create Endpoint",
  request: {
    headers: authHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": { schema: endpointCreateSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": { schema: endpointSchema },
      },
    },
    400: { description: "Bad Request", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    429: { description: "Rate limited", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

export function registerEndpointCollectionRoutes(app: OpenAPIHono<{ Bindings: CloudflareEnv }>) {
  app.openapi(listEndpointsRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpoints: ["read"] },
    });
    if (auth instanceof Response) return auth;

    const enabled = parseEnabledFilter(c.req.valid("query").enabled);
    const conditions = [eq(endpoints.environmentId, auth.environmentId)];
    if (enabled !== undefined) {
      conditions.push(eq(endpoints.isActive, enabled));
    }

    const db = await getDb(c.env);
    const endpointList = await db
      .select()
      .from(endpoints)
      .where(and(...conditions))
      .orderBy(endpoints.createdAt);
    return c.json({ endpoints: endpointList.map(formatEndpoint) }, 200);
  }) as never);

  app.openapi(createEndpointRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpoints: ["create"] },
    });
    if (auth instanceof Response) return auth;

    const body = c.req.valid("json");
    const now = new Date();
    const endpointId = `ep_${auth.environmentId}_${crypto.randomUUID().substring(0, 8)}`;

    const db = await getDb(c.env);
    await db.insert(endpoints).values({
      id: endpointId,
      environmentId: auth.environmentId,
      name: body.name,
      description: body.description,
      url: body.url,
      isActive: body.enabled ?? true,
      retryPolicy: body.retryPolicy ?? "exponential",
      maxRetries: body.maxAttempts ?? 3,
      timeoutMs: body.timeoutMs ?? 10000,
      headers: JSON.stringify(body.customHeaders ?? {}),
      proxyGroupId: body.proxyGroupId,
      createdAt: now,
      updatedAt: now,
    });

    return c.json(
      formatEndpoint({
        id: endpointId,
        environmentId: auth.environmentId,
        name: body.name,
        description: body.description ?? null,
        url: body.url,
        isActive: body.enabled ?? true,
        retryPolicy: body.retryPolicy ?? "exponential",
        maxRetries: body.maxAttempts ?? 3,
        timeoutMs: body.timeoutMs ?? 10000,
        headers: JSON.stringify(body.customHeaders ?? {}),
        proxyGroupId: body.proxyGroupId ?? null,
        createdAt: now,
        updatedAt: now,
      } as typeof endpoints.$inferSelect),
      200
    );
  }) as never);
}
