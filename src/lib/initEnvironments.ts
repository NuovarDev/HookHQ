import { getDb } from "@/db";
import { environments } from "@/db/environments.schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Generate a 4-character hex environment ID
 */
export function generateEnvironmentId(): string {
    return randomBytes(2).toString("hex"); // 2 bytes = 4 hex characters
}

/**
 * Get the default environment ID
 */
export async function getDefaultEnvironmentId(): Promise<string> {
    try {
        const db = await getDb();
        
        const defaultEnv = await db
            .select()
            .from(environments)
            .where(eq(environments.isDefault, true))
            .limit(1);

        if (defaultEnv.length > 0) {
            return defaultEnv[0].id;
        }

        // Fallback to "production" if no default is set
        return "production";
    } catch (error) {
        console.error("Error getting default environment:", error);
        return "production";
    }
}
