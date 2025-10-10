import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { environments } from "@/db/environments.schema";
import {
  endpoints,
  endpointGroups,
  eventTypes,
  webhookMessages,
  webhookAttempts,
  proxyGroups,
  proxyServers
} from "@/db/webhooks.schema";
import { apikeys } from "@/db/auth.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/environments/[id] - Delete an environment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authInstance = await initAuth();
    const session = await authInstance.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: environmentId } = await params;

    if (!environmentId) {
      return NextResponse.json({ error: "Environment ID is required" }, { status: 400 });
    }

    const db = await getDb();

    // Check if environment exists
    const environment = await db
      .select()
      .from(environments)
      .where(eq(environments.id, environmentId))
      .limit(1);

    if (environment.length === 0) {
      return NextResponse.json({ error: "Environment not found" }, { status: 404 });
    }

    // Prevent deletion of default environment
    if (environment[0].isDefault) {
      return NextResponse.json({
        error: "Cannot delete default environment"
      }, { status: 400 });
    }

    // Delete all resources scoped to this environment
    // Note: Order matters due to foreign key constraints

    // 1. Delete webhook attempts (references webhookMessages)
    // First get all message IDs for this environment
    const messageIds = await db
      .select({ id: webhookMessages.id })
      .from(webhookMessages)
      .where(eq(webhookMessages.environmentId, environmentId));

    // Delete attempts for these messages
    for (const message of messageIds) {
      await db
        .delete(webhookAttempts)
        .where(eq(webhookAttempts.messageId, message.id));
    }

    // 2. Delete webhook messages
    await db
      .delete(webhookMessages)
      .where(eq(webhookMessages.environmentId, environmentId));

    // 3. Delete endpoints
    await db
      .delete(endpoints)
      .where(eq(endpoints.environmentId, environmentId));

    // 4. Delete endpoint groups
    await db
      .delete(endpointGroups)
      .where(eq(endpointGroups.environmentId, environmentId));

    // 5. Delete event types
    await db
      .delete(eventTypes)
      .where(eq(eventTypes.environmentId, environmentId));

    // 6. Delete proxy servers
    await db
      .delete(proxyServers)
      .where(eq(proxyServers.environmentId, environmentId));

    // 7. Delete proxy groups
    await db
      .delete(proxyGroups)
      .where(eq(proxyGroups.environmentId, environmentId));

    // 8. Delete API keys scoped to this environment
    // Note: API keys are stored with environment in metadata, so we need to check metadata
    const allApiKeys = await db
      .select({ id: apikeys.id, metadata: apikeys.metadata })
      .from(apikeys);

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
      await db
        .delete(apikeys)
        .where(eq(apikeys.id, apiKey.id));
    }

    // 9. Finally, delete the environment itself
    await db
      .delete(environments)
      .where(eq(environments.id, environmentId));

    return NextResponse.json({
      message: "Environment and all associated resources deleted successfully",
      deletedEnvironment: {
        id: environment[0].id,
        name: environment[0].name
      },
      deletedResources: {
        webhookMessages: "All webhook messages and attempts",
        endpoints: "All endpoints",
        endpointGroups: "All endpoint groups",
        eventTypes: "All event types",
        proxyServers: "All proxy servers",
        proxyGroups: "All proxy groups",
        apiKeys: `${apiKeysToDelete.length} API keys`
      }
    });
  } catch (error) {
    console.error("Error deleting environment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
