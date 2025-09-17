import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { endpoints } from "@/db/webhooks.schema";
import { users } from "@/db/auth.schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateEnvironmentId } from "@/lib/initEnvironments";

/**
 * @swagger
 * /api/endpoints:
 *   get:
 *     description: List endpoints for the current environment
 *     tags:
 *       - Endpoints
 *     responses:
 *       200:
 *         description: List of endpoints
 */
export async function GET(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current environment from user's last environment
        const db = await getDb();
        const user = await db
            .select({ lastEnvironment: users.lastEnvironment })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user[0]?.lastEnvironment) {
            return NextResponse.json({ error: "No environment selected" }, { status: 400 });
        }

        const environmentId = user[0].lastEnvironment;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const enabled = searchParams.get("enabled");

        // Build query conditions
        const conditions = [eq(endpoints.environmentId, environmentId)];
        
        // Add enabled filter if provided
        if (enabled !== null) {
            conditions.push(eq(endpoints.isActive, enabled === "true"));
        }

        // Execute query
        const endpointList = await db
            .select()
            .from(endpoints)
            .where(and(...conditions))
            .orderBy(endpoints.createdAt);

        // Format the response
        const formattedEndpoints = endpointList.map(endpoint => ({
            id: endpoint.id,
            environmentId: endpoint.environmentId,
            name: endpoint.name,
            description: endpoint.description,
            url: endpoint.url,
            enabled: endpoint.isActive,
            retryPolicy: endpoint.retryPolicy,
            maxAttempts: endpoint.maxRetries,
            timeoutMs: endpoint.timeoutMs,
            customHeaders: endpoint.headers ? JSON.parse(endpoint.headers) : {},
            proxyGroupId: endpoint.proxyGroupId,
            createdAt: endpoint.createdAt.toISOString(),
            updatedAt: endpoint.updatedAt.toISOString()
        }));

        return NextResponse.json({ endpoints: formattedEndpoints });
    } catch (error) {
        console.error("Error fetching endpoints:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/endpoints:
 *   post:
 *     description: Create new endpoint
 *     tags:
 *       - Endpoints
 *     responses:
 *       200:
 *         description: Endpoint created
 */
export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current environment from user's last environment
        const db = await getDb();
        const user = await db
            .select({ lastEnvironment: users.lastEnvironment })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user[0]?.lastEnvironment) {
            return NextResponse.json({ error: "No environment selected" }, { status: 400 });
        }

        const environmentId = user[0].lastEnvironment;

        const body = await request.json();
        const { 
            name, 
            description, 
            url, 
            secret, 
            enabled = true, 
            retryPolicy = "exponential_backoff", 
            maxAttempts = 3, 
            timeoutMs = 10000, 
            customHeaders = {},
            proxyGroupId
        } = body as {
            name: string;
            description?: string;
            url: string;
            secret?: string;
            enabled?: boolean;
            retryPolicy?: string;
            maxAttempts?: number;
            timeoutMs?: number;
            customHeaders?: Record<string, string>;
            proxyGroupId?: string;
        };

        if (!name || !url) {
            return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
        }

        // Generate endpoint ID with prefix (ep_{environmentId}_{random})
        const endpointId = `ep_${environmentId}_${crypto.randomUUID().substring(0, 8)}`;
        const now = new Date();

        await db.insert(endpoints).values({
            id: endpointId,
            environmentId,
            name,
            description,
            url,
            isActive: enabled,
            retryPolicy,
            maxRetries: maxAttempts,
            timeoutMs,
            headers: JSON.stringify(customHeaders),
            proxyGroupId,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({
            id: endpointId,
            environmentId,
            name,
            description,
            url,
            enabled,
            retryPolicy,
            maxAttempts,
            timeoutMs,
            customHeaders,
            proxyGroupId,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        });
    } catch (error) {
        console.error("Error creating endpoint:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
