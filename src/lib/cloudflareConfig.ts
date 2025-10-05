import { initAuth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { serverConfig } from "@/db/environments.schema";
import { eq } from "drizzle-orm";

export interface CloudflareConfig {
  cloudflareApiKey: string;
  cloudflareAccountId: string;
  cloudflareQueueId: string;
}

/**
 * Get Cloudflare configuration from database
 */
export async function getCloudflareConfig(): Promise<CloudflareConfig | null> {
  try {
    const db = await getDb();
    
    const config = await db
      .select()
      .from(serverConfig)
      .where(eq(serverConfig.id, "default"))
      .limit(1);

    if (config.length === 0) {
      return null;
    }

    const serverConfigData = config[0];
    
    if (!serverConfigData.cloudflareApiKey || 
        !serverConfigData.cloudflareAccountId || 
        !serverConfigData.cloudflareQueueId) {
      return null;
    }

    return {
      cloudflareApiKey: serverConfigData.cloudflareApiKey,
      cloudflareAccountId: serverConfigData.cloudflareAccountId,
      cloudflareQueueId: serverConfigData.cloudflareQueueId,
    };
  } catch (error) {
    console.error("Error fetching Cloudflare config:", error);
    return null;
  }
}

/**
 * Validate that the current user has admin permissions
 */
export async function validateAdminAccess(): Promise<boolean> {
  try {
    const authInstance = await initAuth();
    const session = await authInstance.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return false;
    }

    if (session?.user?.role !== "admin") {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating admin access:", error);
    return false;
  }
}
