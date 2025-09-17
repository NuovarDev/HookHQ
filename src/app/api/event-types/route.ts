import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { eventTypes } from "@/db/webhooks.schema";
import { users } from "@/db/auth.schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /event-types:
 *   get:
 *     description: List event types for the current environment
 *     tags:
 *       - Event Types
 *     responses:
 *       200:
 *         description: List of event types
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
        const conditions = [eq(eventTypes.environmentId, environmentId)];
        
        // Add enabled filter if provided
        if (enabled !== null) {
            conditions.push(eq(eventTypes.enabled, enabled === "true"));
        }

        // Execute query
        const eventTypeList = await db
            .select()
            .from(eventTypes)
            .where(and(...conditions))
            .orderBy(eventTypes.createdAt);

        // Format the response
        const formattedEventTypes = eventTypeList.map(eventType => ({
            id: eventType.id,
            environmentId: eventType.environmentId,
            name: eventType.name,
            description: eventType.description,
            schema: eventType.schema ? JSON.parse(eventType.schema) : null,
            enabled: eventType.enabled,
            createdAt: eventType.createdAt.toISOString(),
            updatedAt: eventType.updatedAt.toISOString()
        }));

        return NextResponse.json({ eventTypes: formattedEventTypes });
    } catch (error) {
        console.error("Error fetching event types:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /event-types:
 *   post:
 *     description: Create new event type
 *     tags:
 *       - Event Types
 *     responses:
 *       200:
 *         description: Event type created
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
            schema, 
            enabled = true 
        } = body as {
            name: string;
            description?: string;
            schema?: any;
            enabled?: boolean;
        };

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Generate event type ID (environmentId + random string)
        const eventTypeId = `${environmentId}_${crypto.randomUUID().substring(0, 8)}`;
        const now = new Date();

        await db.insert(eventTypes).values({
            id: eventTypeId,
            environmentId,
            name,
            description,
            schema: schema ? JSON.stringify(schema) : null,
            enabled,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({
            id: eventTypeId,
            environmentId,
            name,
            description,
            schema,
            enabled,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        });
    } catch (error) {
        console.error("Error creating event type:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
