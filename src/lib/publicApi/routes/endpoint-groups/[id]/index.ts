import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { endpointGroups, endpoints } from "@/db/webhooks.schema";
import { invalidateEndpointCache, invalidateEndpointGroupCache } from "@/lib/cacheUtils";
import { parseFailureAlertConfig } from "@/lib/destinations/config";
import { buildEndpointGroupUpdateValues, formatEndpointGroup } from "@/lib/publicApi/serializers";
import {
  deleteResponseSchema,
  endpointGroupSchema,
  endpointGroupUpdateSchema,
  errorResponseSchema,
  endpointGroupDeleteQuerySchema,
  endpointGroupIdParamSchema,
} from "@/lib/publicApi/schemas";
import { jsonError, requireEnvironmentAccess } from "@/lib/publicApi/utils";

const getGroupRoute = createRoute({
  method: "get",
  path: "/endpoint-groups/{id}",
  tags: ["Endpoint Groups"],
  summary: "Get Endpoint Group",
  request: { params: endpointGroupIdParamSchema },
  responses: {
    200: {
      description: "Success",
      content: { "application/json": { schema: z.object({ group: endpointGroupSchema }) } },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

const deleteGroupRoute = createRoute({
  method: "delete",
  path: "/endpoint-groups/{id}",
  tags: ["Endpoint Groups"],
  summary: "Delete Endpoint Group",
  request: { params: endpointGroupIdParamSchema, query: endpointGroupDeleteQuerySchema },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: deleteResponseSchema.extend({
            deletedGroup: z.object({ id: z.string(), name: z.string() }),
            deletedEndpoints: z.number().int().nonnegative(),
          }),
        },
      },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

const updateGroupRoute = createRoute({
  method: "patch",
  path: "/endpoint-groups/{id}",
  tags: ["Endpoint Groups"],
  summary: "Update Endpoint Group",
  request: {
    params: endpointGroupIdParamSchema,
    body: { required: true, content: { "application/json": { schema: endpointGroupUpdateSchema } } },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z.object({ message: z.string(), group: endpointGroupSchema }),
        },
      },
    },
    400: { description: "Bad Request", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    403: { description: "Forbidden", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

export function registerEndpointGroupItemRoutes(app: OpenAPIHono<{ Bindings: CloudflareEnv }>) {
  app.openapi(getGroupRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpointGroups: ["read"] },
    });
    if (auth instanceof Response) return auth;
    const { id } = c.req.valid("param");
    const db = await getDb(c.env);
    const group = await db.select().from(endpointGroups).where(eq(endpointGroups.id, id)).limit(1);
    if (group.length === 0) return jsonError("Endpoint group not found", 404);
    return c.json({ group: formatEndpointGroup(group[0]) }, 200);
  }) as never);

  app.openapi(deleteGroupRoute, (async (c: any) => {
    const { deleteEndpoints } = c.req.valid("query");
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions:
        deleteEndpoints === "true"
          ? { endpointGroups: ["delete"], endpoints: ["delete"] }
          : { endpointGroups: ["delete"] },
    });
    if (auth instanceof Response) return auth;
    const { id } = c.req.valid("param");
    const db = await getDb(c.env);
    const group = await db
      .select()
      .from(endpointGroups)
      .where(and(eq(endpointGroups.id, id), eq(endpointGroups.environmentId, auth.environmentId)))
      .limit(1);
    if (group.length === 0) return jsonError("Endpoint group not found", 404);
    const endpointIds = deleteEndpoints === "true" ? JSON.parse(group[0].endpointIds) : [];
    const endpointsToDelete =
      Array.isArray(endpointIds) && endpointIds.length > 0
        ? await db
            .select({ id: endpoints.id })
            .from(endpoints)
            .where(and(eq(endpoints.environmentId, auth.environmentId), inArray(endpoints.id, endpointIds)))
        : [];

    const deleteGroup = db
      .delete(endpointGroups)
      .where(and(eq(endpointGroups.id, id), eq(endpointGroups.environmentId, auth.environmentId)));
    if (endpointsToDelete.length > 0) {
      await db.batch([
        db.delete(endpoints).where(
          inArray(
            endpoints.id,
            endpointsToDelete.map(endpoint => endpoint.id)
          )
        ),
        deleteGroup,
      ]);
    } else {
      await deleteGroup;
    }
    await Promise.all(endpointsToDelete.map(endpoint => invalidateEndpointCache(endpoint.id, c.env)));
    await invalidateEndpointGroupCache(id, c.env);
    return c.json(
      {
        message: "Endpoint group deleted successfully",
        deletedGroup: { id: group[0].id, name: group[0].name },
        deletedEndpoints: endpointsToDelete.length,
      },
      200
    );
  }) as never);

  app.openapi(updateGroupRoute, (async (c: any) => {
    const auth = await requireEnvironmentAccess(c.req.raw, c.env, {
      permissions: { endpointGroups: ["update"] },
    });
    if (auth instanceof Response) return auth;
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = await getDb(c.env);
    const existing = await db.select().from(endpointGroups).where(eq(endpointGroups.id, id)).limit(1);
    if (existing.length === 0) return jsonError("Endpoint group not found", 404);
    const updateData = buildEndpointGroupUpdateValues({
      name: body.name,
      description: body.description,
      endpointIds: body.endpointIds,
      eventTypes: body.eventTypes,
      proxyGroupId: body.proxyGroupId,
      enabled: body.enabled,
      failureAlerts: body.failureAlerts,
      metadata: body.metadata,
      existingFailureAlerts: parseFailureAlertConfig(existing[0].failureAlertConfig),
    });
    await db
      .update(endpointGroups)
      .set(updateData as never)
      .where(eq(endpointGroups.id, id));
    await invalidateEndpointGroupCache(id, c.env);
    const updated = await db.select().from(endpointGroups).where(eq(endpointGroups.id, id)).limit(1);
    return c.json({ message: "Endpoint group updated successfully", group: formatEndpointGroup(updated[0]) }, 200);
  }) as never);
}
