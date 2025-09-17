import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { eventTypes } from "@/db/webhooks.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/event-types/{id}:
 *   delete:
 *     description: Delete an event type
 *     tags:
 *       - Event Types
 *     responses:
 *       200:
 *         description: Event type deleted
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

        const eventTypeId = params.id;

        if (!eventTypeId) {
            return NextResponse.json({ error: "Event type ID is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if event type exists
        const eventType = await db
            .select()
            .from(eventTypes)
            .where(eq(eventTypes.id, eventTypeId))
            .limit(1);

        if (eventType.length === 0) {
            return NextResponse.json({ error: "Event type not found" }, { status: 404 });
        }

        // TODO: Add environment ownership check when we have user environment tracking
        // For now, we'll allow deletion if the event type exists

        // Delete the event type
        await db
            .delete(eventTypes)
            .where(eq(eventTypes.id, eventTypeId));

        return NextResponse.json({ 
            message: "Event type deleted successfully",
            deletedEventType: {
                id: eventType[0].id,
                name: eventType[0].name
            }
        });
    } catch (error) {
        console.error("Error deleting event type:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/event-types/{id}:
 *   patch:
 *     description: Update an event type
 *     tags:
 *       - Event Types
 *     parameters:
 *       - name: ID
 *         in: path
 *         required: true
 *         description: Event type ID
 *         schema:
 *           type: string
 *         example:
 *           user.created
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 description: Event type name
 *                 type: string
 *                 example:
 *                   User Created
 *               description:
 *                 description: Event type description
 *                 type: string
 *                 example:
 *                   User created event
 *               schema:
 *                 description: Event type schema
 *                 type: object
 *                 example:
 *                   { "type": "object", "properties": { "userId": { "type": "string" } } }
 *               enabled:
 *                 description: Event type enabled status
 *                 type: boolean
 *                 example:
 *                   true
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event type updated
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

        const eventTypeId = params.id;
        const body = await request.json();

        if (!eventTypeId) {
            return NextResponse.json({ error: "Event type ID is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if event type exists
        const existingEventType = await db
            .select()
            .from(eventTypes)
            .where(eq(eventTypes.id, eventTypeId))
            .limit(1);

        if (existingEventType.length === 0) {
            return NextResponse.json({ error: "Event type not found" }, { status: 404 });
        }

        // Update the event type
        const updateData: any = {
            updatedAt: new Date()
        };

        // Only update fields that are provided
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.schema !== undefined) updateData.schema = JSON.stringify(body.schema);
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        await db
            .update(eventTypes)
            .set(updateData)
            .where(eq(eventTypes.id, eventTypeId));

        // Return updated event type
        const updatedEventType = await db
            .select()
            .from(eventTypes)
            .where(eq(eventTypes.id, eventTypeId))
            .limit(1);

        return NextResponse.json({
            message: "Event type updated successfully",
            eventType: {
                id: updatedEventType[0].id,
                environmentId: updatedEventType[0].environmentId,
                name: updatedEventType[0].name,
                description: updatedEventType[0].description,
                schema: updatedEventType[0].schema ? JSON.parse(updatedEventType[0].schema) : {},
                enabled: updatedEventType[0].isActive,
                createdAt: updatedEventType[0].createdAt.toISOString(),
                updatedAt: updatedEventType[0].updatedAt.toISOString(),
            }
        });
    } catch (error) {
        console.error("Error updating event type:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
