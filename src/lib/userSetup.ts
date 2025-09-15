import { getDb } from "@/db";
import { apikeys } from "@/db/auth.schema";
import { generateApiKey, generateApiKeyId, serializePermissions, getDefaultPermissions } from "./apiKeys";
import { getDefaultEnvironmentId } from "./initEnvironments";

/**
 * Create a default API key for a new user
 */
export async function createDefaultApiKey(userId: string, userName?: string) {
    try {
        const db = await getDb();
        
        // Get the default environment ID
        const environmentId = await getDefaultEnvironmentId();
        
        const apiKeyId = generateApiKeyId();
        const apiKey = generateApiKey();
        const now = new Date();

        await db.insert(apikeys).values({
            id: apiKeyId,
            name: `${userName || "User"}'s Default Key`,
            metadata: JSON.stringify({ environment: environmentId }),
            key: apiKey,
            userId,
            permissions: serializePermissions(getDefaultPermissions()),
            enabled: true,
            createdAt: now,
            updatedAt: now,
        });

        console.log(`Created default API key for user ${userId} in environment ${environmentId}`);
        return { id: apiKeyId, key: apiKey };
    } catch (error) {
        console.error("Error creating default API key:", error);
        throw error;
    }
}
