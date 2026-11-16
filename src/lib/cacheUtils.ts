import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { endpoints, proxyGroups, proxyServers } from "@/db/webhooks.schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Cache endpoint data in KV for faster consumer processing and return the data
 */
export async function cacheEndpointData(
  endpointIds: string[],
  environmentId: string,
  env: CloudflareEnv
): Promise<any[]> {
  if (endpointIds.length === 0) {
    return [];
  }

  const db = await getDb(env);

  // Cache individual endpoints
  const endpointData = await db
    .select()
    .from(endpoints)
    .where(and(eq(endpoints.environmentId, environmentId), inArray(endpoints.id, endpointIds)));

  for (const endpoint of endpointData) {
    await env.KV.put(endpoint.id, JSON.stringify(endpoint));

    // Also cache proxy group data if this endpoint uses a proxy
    if (endpoint.proxyGroupId) {
      const proxyGroup = await db
        .select()
        .from(proxyGroups)
        .where(and(eq(proxyGroups.id, endpoint.proxyGroupId), eq(proxyGroups.environmentId, environmentId)))
        .limit(1);

      if (proxyGroup[0]) {
        const proxyIds = JSON.parse(proxyGroup[0].proxyIds);

        // Get proxy servers for this group
        const proxies = await db
          .select()
          .from(proxyServers)
          .where(and(eq(proxyServers.environmentId, environmentId), eq(proxyServers.isActive, true)));

        const groupProxies = proxies.filter(proxy => proxyIds.includes(proxy.id));

        // Cache the group data
        await env.KV.put(
          endpoint.proxyGroupId,
          JSON.stringify({
            id: endpoint.proxyGroupId,
            proxyIds: proxyIds,
            loadBalancingStrategy: proxyGroup[0].loadBalancingStrategy,
            isActive: proxyGroup[0].isActive,
            environmentId: proxyGroup[0].environmentId,
            servers: groupProxies,
            expirationTtl: 60 * 60 * 24 * 30, // 30 days
          })
        );
      }
    }
  }

  return endpointData;
}

/**
 * Invalidate endpoint group cache for a specific group
 * This should be called whenever an endpoint group is updated or deleted
 */
export async function invalidateEndpointGroupCache(groupId: string, providedEnv?: CloudflareEnv): Promise<void> {
  try {
    const env = providedEnv ?? (await getCloudflareContext({ async: true })).env;

    // Bumping the generation invalidates every event-type cache variant without
    // needing KV key enumeration (which KV does not support).
    await env.KV.put(`group:${groupId}:generation`, crypto.randomUUID());
  } catch (error) {
    console.error("Error invalidating endpoint group cache:", error);
    // Don't throw - cache invalidation failure shouldn't break the main operation
  }
}

/**
 * Invalidate endpoint cache for a specific endpoint
 * This should be called whenever an endpoint is updated or deleted
 */
export async function invalidateEndpointCache(endpointId: string, providedEnv?: CloudflareEnv): Promise<void> {
  try {
    const env = providedEnv ?? (await getCloudflareContext({ async: true })).env;

    // Delete the cached endpoint data
    await env.KV.delete(endpointId);

    // Also delete any cached proxy group data if this endpoint was using a proxy
    // Note: This is a simplified approach - in production you might want to track proxy group usage
  } catch (error) {
    console.error("Error invalidating endpoint cache:", error);
    // Don't throw - cache invalidation failure shouldn't break the main operation
  }
}
