import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { apikeys } from "@/db/auth.schema";
import { generateApiKey, generateApiKeyId, serializePermissions, ApiKeyPermission } from "@/lib/apiKeys";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/api-keys - List user's API keys
export async function GET() {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use Better Auth API key plugin to get structured data with start and lastRequest
        try {
            const apiKeys = await authInstance.api.listApiKeys({ headers: await headers() });
            console.log("Plugin API keys response:", apiKeys);
            
            // Transform the plugin response to our expected format
            const formattedKeys = apiKeys.map((key: any) => ({
                id: key.id,
                name: key.name || "Unnamed Key",
                key: key.key || null, // May be null for security
                start: key.start, // First few characters
                permissions: key.permissions ? JSON.parse(key.permissions) as ApiKeyPermission[] : [],
                enabled: key.enabled,
                createdAt: key.createdAt,
                lastUsed: key.lastRequest, // Better Auth uses lastRequest
                lastRequest: key.lastRequest,
                metadata: key.metadata ? JSON.parse(key.metadata) : undefined
            }));

            return NextResponse.json({ apiKeys: formattedKeys });
        } catch (pluginError) {
            console.log("API key plugin not available, using direct DB access");
            
            // Fallback to direct database access
            const db = await getDb();
            const userApiKeys = await db
                .select()
                .from(apikeys)
                .where(eq(apikeys.userId, session.user.id))
                .orderBy(apikeys.createdAt);

            const formattedKeys = userApiKeys.map(key => ({
                id: key.id,
                name: key.name || "Unnamed Key",
                key: key.key,
                start: key.key ? key.key.substring(0, 8) : undefined, // Generate start from key
                permissions: key.permissions ? JSON.parse(key.permissions) as ApiKeyPermission[] : [],
                enabled: key.enabled,
                createdAt: key.createdAt.toISOString(),
                lastUsed: key.lastRequest?.toISOString(),
                lastRequest: key.lastRequest?.toISOString(),
                metadata: key.metadata ? JSON.parse(key.metadata) : undefined
            }));

            return NextResponse.json({ apiKeys: formattedKeys });
        }
    } catch (error) {
        console.error("Error fetching API keys:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/api-keys - Create new API key
export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, permissions, environment } = body as { name: string; permissions: ApiKeyPermission[]; environment: string };

        if (!name || !permissions || !Array.isArray(permissions) || !environment) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        // Validate permissions are valid ApiKeyPermission types
        const validPermissions = permissions.filter(p => 
            typeof p === "string" && (
                p === "all_permissions" || 
                p.startsWith("endpoints:") || 
                p.startsWith("messages:")
            )
        ) as ApiKeyPermission[];

        if (validPermissions.length === 0) {
            return NextResponse.json({ error: "At least one valid permission is required" }, { status: 400 });
        }

        // Use Better Auth API key plugin if available, otherwise fallback to direct DB access
        try {
            // Try to use Better Auth API key plugin methods
            const apiKey = await authInstance.api.createApiKey({ 
                headers: await headers(),
                body: { name, permissions: { permissions: validPermissions }, metadata: {
                  environment
                } }
            });
            return NextResponse.json(apiKey);
        } catch (pluginError) {
            console.log("API key plugin not available, using direct DB access");
            
            // Fallback to direct database access
            const db = await getDb();
            const apiKeyId = generateApiKeyId();
            const apiKey = generateApiKey();
            const now = new Date();

            await db.insert(apikeys).values({
                id: apiKeyId,
                name, 
                metadata: JSON.stringify({ environment }),
                key: apiKey,
                userId: session.user.id,
                permissions: serializePermissions(validPermissions),
                enabled: true,
                createdAt: now,
                updatedAt: now,
            });

            return NextResponse.json({
                id: apiKeyId,
                name,
                environment,
                key: apiKey,
                permissions: validPermissions,
                enabled: true,
                createdAt: now.toISOString(),
            });
        }
    } catch (error) {
        console.error("Error creating API key:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
