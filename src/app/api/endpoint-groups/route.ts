import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { endpointGroups } from "@/db/webhooks.schema";
import { users } from "@/db/auth.schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /endpoint-groups:
 *   get:
 *     description: List endpoint groups for the current environment
 *     tags:
 *       - Endpoint Groups
 *     responses:
 *       200:
 *         description: List of endpoint groups
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
        const conditions = [eq(endpointGroups.environmentId, environmentId)];
        
        // Add enabled filter if provided
        if (enabled !== null) {
            conditions.push(eq(endpointGroups.isActive, enabled === "true"));
        }

        // Execute query
        const groupList = await db
            .select()
            .from(endpointGroups)
            .where(and(...conditions))
            .orderBy(endpointGroups.createdAt);

        // Format the response
        const formattedGroups = groupList.map(group => ({
            id: group.id,
            environmentId: group.environmentId,
            name: group.name,
            description: group.description,
            endpointIds: JSON.parse(group.endpointIds),
            enabled: group.isActive,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString()
        }));

        return NextResponse.json({ endpointGroups: formattedGroups });
    } catch (error) {
        console.error("Error fetching endpoint groups:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /endpoint-groups:
 *   post:
 *     description: Create new endpoint group
 *     tags:
 *       - Endpoint Groups
 *     responses:
 *       200:
 *         description: Endpoint group created
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
            endpointIds = [], 
            enabled = true 
        } = body as {
            name: string;
            description?: string;
            endpointIds?: string[];
            enabled?: boolean;
        };

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Generate endpoint group ID with prefix (grp_{environmentId}_{random})
        const groupId = `grp_${environmentId}_${crypto.randomUUID().substring(0, 8)}`;
        const now = new Date();

        await db.insert(endpointGroups).values({
            id: groupId,
            environmentId,
            name,
            description,
            endpointIds: JSON.stringify(endpointIds),
            isActive: enabled,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({
            id: groupId,
            environmentId,
            name,
            description,
            endpointIds,
            enabled,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        });
    } catch (error) {
        console.error("Error creating endpoint group:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
