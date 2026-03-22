import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { serverConfig } from "@/db/environments.schema";
import { endpoints } from "@/db/webhooks.schema";
import { parseAutoDisableConfig } from "@/lib/destinations/config";
import { buildEndpointInsertValues, formatEndpoint } from "@/lib/publicApi/serializers";
import {
  enabledQuerySchema,
  endpointCreateSchema,
  endpointSchema,
  errorResponseSchema,
} from "@/lib/publicApi/schemas";
import { parseEnabledFilter, requireEnvironmentAccess } from "@/lib/publicApi/utils";

const listEndpointsRoute = createRoute({
  method: "get",
  path: "/endpoints",
  tags: ["Endpoints"],
  summary: "List Endpoints",
  request: {
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
    const [globalConfig] = await db.select().from(serverConfig).where(eq(serverConfig.id, "default")).limit(1);
    const values = buildEndpointInsertValues({
      id: endpointId,
      environmentId: auth.environmentId,
      name: body.name,
      description: body.description,
      eventTypes: body.eventTypes,
      enabled: body.enabled,
      destinationType: body.destinationType,
      destination: body.destination,
      retry: body.retry,
      autoDisable: body.autoDisable ?? parseAutoDisableConfig(globalConfig?.defaultAutoDisableConfig),
      now,
    });
    await db.insert(endpoints).values(values);

    return c.json(formatEndpoint(values as typeof endpoints.$inferSelect), 200);
  }) as never);
}
