import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { endpointGroups } from "@/db/webhooks.schema";
import { buildEndpointGroupInsertValues, formatEndpointGroup } from "@/lib/publicApi/serializers";
import {
  enabledQuerySchema,
  endpointGroupCreateSchema,
  endpointGroupSchema,
  errorResponseSchema,
} from "@/lib/publicApi/schemas";
import { jsonError, parseEnabledFilter, requireEnvironmentAccess } from "@/lib/publicApi/utils";

const listGroupsRoute = createRoute({
  method: "get",
  path: "/endpoint-groups",
  tags: ["Endpoint Groups"],
  summary: "List Endpoint Groups",
  request: { query: enabledQuerySchema },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: z.object({ endpointGroups: z.array(endpointGroupSchema) }) } },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    429: { description: "Rate limited", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

const createGroupRoute = createRoute({
  method: "post",
  path: "/endpoint-groups",
  tags: ["Endpoint Groups"],
  summary: "Create Endpoint Group",
  request: {
    body: { required: true, content: { "application/json": { schema: endpointGroupCreateSchema } } },
  },
  responses: {
    200: { description: "Success", content: { "application/json": { schema: endpointGroupSchema } } },
    400: { description: "Bad Request", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

export function registerEndpointGroupCollectionRoutes(app: OpenAPIHono<{ Bindings: CloudflareEnv }>) {
  app.openapi(listGroupsRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpointGroups: ["read"] },
    });
    if (auth instanceof Response) return auth;
    const enabled = parseEnabledFilter(c.req.valid("query").enabled);
    let metadata: Record<string, string> = {};
    const metadataQuery = c.req.valid("query").metadata;
    if (metadataQuery) {
      try {
        metadata = z.record(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/), z.string()).parse(JSON.parse(metadataQuery));
      } catch {
        return jsonError("metadata must be a JSON object with string values", 400);
      }
    }
    const conditions = [eq(endpointGroups.environmentId, auth.environmentId)];
    if (enabled !== undefined) conditions.push(eq(endpointGroups.isActive, enabled));
    for (const [key, value] of Object.entries(metadata)) {
      conditions.push(sql`json_extract(${endpointGroups.metadata}, ${`$.${key}`}) = ${value}`);
    }
    const db = await getDb(c.env);
    const groups = await db
      .select()
      .from(endpointGroups)
      .where(and(...conditions))
      .orderBy(endpointGroups.createdAt);
    return c.json({ endpointGroups: groups.map(formatEndpointGroup) }, 200);
  }) as never);

  app.openapi(createGroupRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpointGroups: ["create"] },
    });
    if (auth instanceof Response) return auth;
    const body = c.req.valid("json");
    const now = new Date();
    const id = `grp_${auth.environmentId}_${crypto.randomUUID().substring(0, 8)}`;
    const db = await getDb(c.env);
    const values = buildEndpointGroupInsertValues({
      id,
      environmentId: auth.environmentId,
      name: body.name,
      description: body.description,
      endpointIds: body.endpointIds,
      eventTypes: body.eventTypes,
      proxyGroupId: body.proxyGroupId,
      enabled: body.enabled,
      failureAlerts: body.failureAlerts,
      metadata: body.metadata,
      now,
    });
    await db.insert(endpointGroups).values(values);
    return c.json(formatEndpointGroup(values as typeof endpointGroups.$inferSelect), 200);
  }) as never);
}
