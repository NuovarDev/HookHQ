import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import { apikeys } from "@/db/auth.schema";
import { getDb } from "@/db";
import { environments } from "@/db/environments.schema";
import {
  endpointGroups,
  endpoints,
  eventTypes,
  proxyGroups,
  proxyServers,
  webhookAttempts,
  webhookMessages,
} from "@/db/webhooks.schema";
import {
  resolveDestinationConfig,
  serializeDestinationConfig,
  parseFailureAlertConfig,
  serializeFailureAlertConfig,
} from "@/lib/destinations/config";
import { generateEnvironmentId } from "@/lib/environments";
import { authenticateSessionRequest } from "@/lib/publicApi/auth";
import {
  cloneEnvironmentSchema,
  deleteResponseSchema,
  environmentIdParamSchema,
  environmentSchema,
  errorResponseSchema,
} from "@/lib/publicApi/schemas";
import { jsonError } from "@/lib/publicApi/utils";
import { eq } from "drizzle-orm";

type CloneOptions = {
  endpoints: boolean;
  endpointGroups: boolean;
  eventTypes: boolean;
  proxyServers: boolean;
  proxyGroups: boolean;
};

function cloneResourceId(sourceId: string, sourceEnvironmentId: string, targetEnvironmentId: string) {
  const environmentOffset = sourceId.indexOf(sourceEnvironmentId);

  if (environmentOffset < 0) {
    throw new Error(`Cannot clone resource ID "${sourceId}" because it does not contain its environment ID.`);
  }

  return `${sourceId.slice(0, environmentOffset)}${targetEnvironmentId}${sourceId.slice(
    environmentOffset + sourceEnvironmentId.length
  )}`;
}

function parseIds(value: string | null | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

const deleteEnvironmentRoute = createRoute({
  method: "delete",
  path: "/environments/{id}",
  tags: ["Environments"],
  summary: "Delete Environment",
  request: { params: environmentIdParamSchema },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: deleteResponseSchema.extend({
            deletedEnvironment: z.object({
              id: z.string(),
              name: z.string(),
            }),
            deletedResources: z.record(z.string(), z.string()),
          }),
        },
      },
    },
    400: { description: "Bad Request", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

const cloneEnvironmentRoute = createRoute({
  method: "post",
  path: "/environments/{id}/clone",
  tags: ["Environments"],
  summary: "Clone Environment",
  request: {
    params: environmentIdParamSchema,
    body: { required: true, content: { "application/json": { schema: cloneEnvironmentSchema } } },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: z.object({
            environment: environmentSchema,
            copiedResources: z.record(z.string(), z.number()),
          }),
        },
      },
    },
    400: { description: "Bad Request", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "Not Found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});

export function registerEnvironmentItemRoutes(app: OpenAPIHono<{ Bindings: CloudflareEnv }>) {
  app.openapi(cloneEnvironmentRoute, (async (c: any) => {
    const session = await authenticateSessionRequest(c.req.raw, c.env);

    if (!session.success) {
      return session.response;
    }

    const { id: sourceEnvironmentId } = c.req.valid("param");
    const body = c.req.valid("json") as {
      name: string;
      description?: string;
      copy: CloneOptions;
    };
    const db = await getDb(c.env);
    const sourceEnvironment = await db
      .select()
      .from(environments)
      .where(eq(environments.id, sourceEnvironmentId))
      .limit(1);

    if (sourceEnvironment.length === 0) {
      return jsonError("Environment not found", 404);
    }

    const name = body.name.trim();
    const existingName = await db
      .select({ id: environments.id })
      .from(environments)
      .where(eq(environments.name, name))
      .limit(1);
    if (existingName.length > 0) {
      return jsonError("An environment with this name already exists", 400);
    }

    const targetEnvironmentId = generateEnvironmentId();
    const now = new Date();
    const sourceEndpoints = body.copy.endpoints
      ? await db.select().from(endpoints).where(eq(endpoints.environmentId, sourceEnvironmentId))
      : [];
    const sourceEndpointGroups = body.copy.endpointGroups
      ? await db.select().from(endpointGroups).where(eq(endpointGroups.environmentId, sourceEnvironmentId))
      : [];
    const sourceEventTypes = body.copy.eventTypes
      ? await db.select().from(eventTypes).where(eq(eventTypes.environmentId, sourceEnvironmentId))
      : [];
    const sourceProxyServers = body.copy.proxyServers
      ? await db.select().from(proxyServers).where(eq(proxyServers.environmentId, sourceEnvironmentId))
      : [];
    const sourceProxyGroups = body.copy.proxyGroups
      ? await db.select().from(proxyGroups).where(eq(proxyGroups.environmentId, sourceEnvironmentId))
      : [];

    try {
      const endpointIdMap = new Map(
        sourceEndpoints.map(endpoint => [
          endpoint.id,
          cloneResourceId(endpoint.id, sourceEnvironmentId, targetEnvironmentId),
        ])
      );
      const proxyServerIdMap = new Map(
        sourceProxyServers.map(proxy => [proxy.id, cloneResourceId(proxy.id, sourceEnvironmentId, targetEnvironmentId)])
      );
      const proxyGroupIdMap = new Map(
        sourceProxyGroups.map(group => [group.id, cloneResourceId(group.id, sourceEnvironmentId, targetEnvironmentId)])
      );

      const clonedEndpoints = await Promise.all(
        sourceEndpoints.map(async endpoint => {
          const destination = await resolveDestinationConfig(endpoint, c.env);
          const remappedDestination =
            destination.type === "webhook"
              ? {
                  ...destination,
                  proxyGroupId: destination.proxyGroupId
                    ? (proxyGroupIdMap.get(destination.proxyGroupId) ?? null)
                    : null,
                }
              : destination;

          return {
            ...endpoint,
            id: endpointIdMap.get(endpoint.id)!,
            environmentId: targetEnvironmentId,
            proxyGroupId: endpoint.proxyGroupId ? (proxyGroupIdMap.get(endpoint.proxyGroupId) ?? null) : null,
            destinationConfig: await serializeDestinationConfig(remappedDestination, c.env),
            createdAt: now,
            updatedAt: now,
          };
        })
      );

      const clonedEndpointGroups = sourceEndpointGroups.map(group => {
        const failureAlerts = parseFailureAlertConfig(group.failureAlertConfig);

        return {
          ...group,
          id: cloneResourceId(group.id, sourceEnvironmentId, targetEnvironmentId),
          environmentId: targetEnvironmentId,
          endpointIds: JSON.stringify(parseIds(group.endpointIds).flatMap(id => endpointIdMap.get(id) ?? [])),
          proxyGroupId: group.proxyGroupId ? (proxyGroupIdMap.get(group.proxyGroupId) ?? null) : null,
          failureAlertConfig: serializeFailureAlertConfig({
            ...failureAlerts,
            endpointIds: failureAlerts.endpointIds.flatMap(id => endpointIdMap.get(id) ?? []),
          }),
          createdAt: now,
          updatedAt: now,
        };
      });

      const clonedProxyServers = sourceProxyServers.map(proxy => ({
        ...proxy,
        id: proxyServerIdMap.get(proxy.id)!,
        environmentId: targetEnvironmentId,
        createdAt: now,
        updatedAt: now,
      }));
      const clonedProxyGroups = sourceProxyGroups.map(group => ({
        ...group,
        id: proxyGroupIdMap.get(group.id)!,
        environmentId: targetEnvironmentId,
        proxyIds: JSON.stringify(parseIds(group.proxyIds).flatMap(id => proxyServerIdMap.get(id) ?? [])),
        createdAt: now,
        updatedAt: now,
      }));
      const clonedEventTypes = sourceEventTypes.map(eventType => ({
        ...eventType,
        id: cloneResourceId(eventType.id, sourceEnvironmentId, targetEnvironmentId),
        environmentId: targetEnvironmentId,
        createdAt: now,
        updatedAt: now,
      }));

      await db.batch([
        db.insert(environments).values({
          id: targetEnvironmentId,
          name,
          description: body.description?.trim() || null,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        }),
        ...clonedProxyServers.map(proxy => db.insert(proxyServers).values(proxy)),
        ...clonedProxyGroups.map(group => db.insert(proxyGroups).values(group)),
        ...clonedEventTypes.map(eventType => db.insert(eventTypes).values(eventType)),
        ...clonedEndpoints.map(endpoint => db.insert(endpoints).values(endpoint)),
        ...clonedEndpointGroups.map(group => db.insert(endpointGroups).values(group)),
      ]);
    } catch (error) {
      console.error("Failed to clone environment", error);
      return jsonError(error instanceof Error ? error.message : "Failed to clone environment", 400);
    }

    return c.json(
      {
        environment: {
          id: targetEnvironmentId,
          name,
          description: body.description?.trim() || null,
          isDefault: false,
          createdAt: now.toISOString(),
        },
        copiedResources: {
          endpoints: sourceEndpoints.length,
          endpointGroups: sourceEndpointGroups.length,
          eventTypes: sourceEventTypes.length,
          proxyServers: sourceProxyServers.length,
          proxyGroups: sourceProxyGroups.length,
        },
      },
      200
    );
  }) as never);

  app.openapi(deleteEnvironmentRoute, (async (c: any) => {
    const session = await authenticateSessionRequest(c.req.raw, c.env);

    if (!session.success) {
      return session.response;
    }

    const { id: environmentId } = c.req.valid("param");
    const db = await getDb(c.env);
    const environment = await db.select().from(environments).where(eq(environments.id, environmentId)).limit(1);

    if (environment.length === 0) {
      return jsonError("Environment not found", 404);
    }

    if (environment[0].isDefault) {
      return jsonError("Cannot delete default environment", 400);
    }

    const messageIds = await db
      .select({ id: webhookMessages.id })
      .from(webhookMessages)
      .where(eq(webhookMessages.environmentId, environmentId));

    for (const message of messageIds) {
      await db.delete(webhookAttempts).where(eq(webhookAttempts.messageId, message.id));
    }

    await db.delete(webhookMessages).where(eq(webhookMessages.environmentId, environmentId));
    await db.delete(endpoints).where(eq(endpoints.environmentId, environmentId));
    await db.delete(endpointGroups).where(eq(endpointGroups.environmentId, environmentId));
    await db.delete(eventTypes).where(eq(eventTypes.environmentId, environmentId));
    await db.delete(proxyServers).where(eq(proxyServers.environmentId, environmentId));
    await db.delete(proxyGroups).where(eq(proxyGroups.environmentId, environmentId));

    const allApiKeys = await db.select({ id: apikeys.id, metadata: apikeys.metadata }).from(apikeys);
    const apiKeysToDelete = allApiKeys.filter(apiKey => {
      if (!apiKey.metadata) return false;

      try {
        const metadata = JSON.parse(apiKey.metadata);
        return metadata.environment === environmentId;
      } catch {
        return false;
      }
    });

    for (const apiKey of apiKeysToDelete) {
      await db.delete(apikeys).where(eq(apikeys.id, apiKey.id));
    }

    await db.delete(environments).where(eq(environments.id, environmentId));

    return c.json(
      {
        message: "Environment and all associated resources deleted successfully",
        deletedEnvironment: {
          id: environment[0].id,
          name: environment[0].name,
        },
        deletedResources: {
          webhookMessages: "All webhook messages and attempts",
          endpoints: "All endpoints",
          endpointGroups: "All endpoint groups",
          eventTypes: "All event types",
          proxyServers: "All proxy servers",
          proxyGroups: "All proxy groups",
          apiKeys: `${apiKeysToDelete.length} API keys`,
        },
      },
      200
    );
  }) as never);
}
