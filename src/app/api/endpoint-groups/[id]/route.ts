import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { endpointGroups } from "@/db/webhooks.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /endpoint-groups/{id}:
 *   delete:
 *     description: Delete an endpoint group
 *     tags:
 *       - Endpoint Groups
 *     responses:
 *       200:
 *         description: Endpoint group deleted
 *   
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const groupId = params.id;

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if endpoint group exists
        const endpointGroup = await db
            .select()
            .from(endpointGroups)
            .where(eq(endpointGroups.id, groupId))
            .limit(1);

        if (endpointGroup.length === 0) {
            return NextResponse.json({ error: "Endpoint group not found" }, { status: 404 });
        }

        // TODO: Add environment ownership check when we have user environment tracking
        // For now, we'll allow deletion if the group exists

        // Delete the endpoint group
        await db
            .delete(endpointGroups)
            .where(eq(endpointGroups.id, groupId));

        return NextResponse.json({ 
            message: "Endpoint group deleted successfully",
            deletedGroup: {
                id: endpointGroup[0].id,
                name: endpointGroup[0].name
            }
        });
    } catch (error) {
        console.error("Error deleting endpoint group:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /endpoint-groups/{id}:
 *   patch:
 *     description: Update an endpoint group
 *     tags:
 *       - Endpoint Groups
 *     responses:
 *       200:
 *         description: Endpoint group updated
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const groupId = params.id;
        const body = await request.json();

        if (!groupId) {
            return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if endpoint group exists
        const existingGroup = await db
            .select()
            .from(endpointGroups)
            .where(eq(endpointGroups.id, groupId))
            .limit(1);

        if (existingGroup.length === 0) {
            return NextResponse.json({ error: "Endpoint group not found" }, { status: 404 });
        }

        // Update the endpoint group
        const updateData: any = {
            updatedAt: new Date()
        };

        // Only update fields that are provided
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.endpointIds !== undefined) updateData.endpointIds = JSON.stringify(body.endpointIds);
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        await db
            .update(endpointGroups)
            .set(updateData)
            .where(eq(endpointGroups.id, groupId));

        // Return updated endpoint group
        const updatedGroup = await db
            .select()
            .from(endpointGroups)
            .where(eq(endpointGroups.id, groupId))
            .limit(1);

        return NextResponse.json({
            message: "Endpoint group updated successfully",
            group: {
                id: updatedGroup[0].id,
                environmentId: updatedGroup[0].environmentId,
                name: updatedGroup[0].name,
                description: updatedGroup[0].description,
                endpointIds: updatedGroup[0].endpointIds ? JSON.parse(updatedGroup[0].endpointIds) : [],
                enabled: updatedGroup[0].isActive,
                createdAt: updatedGroup[0].createdAt.toISOString(),
                updatedAt: updatedGroup[0].updatedAt.toISOString(),
            }
        });
    } catch (error) {
        console.error("Error updating endpoint group:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
