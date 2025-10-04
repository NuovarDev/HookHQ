import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { eventTypes } from "@/db/webhooks.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateSchema } from "@/lib/schemaValidation";
import { authenticateApiRequest } from "@/lib/apiHelpers";

/**
 * @swagger
 * /event-types/{id}:
 *   get:
 *     summary: Get Event Type
 *     description: Get an event type by ID
 *     tags:
 *       - Event Types
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Event type ID
 *                 environmentId:
 *                   type: string
 *                   description: Environment ID
 *                 name:
 *                   type: string
 *                   description: Event type name
 *                 description:
 *                   type: string
 *                   description: Event type description
 *                 schema:
 *                   type: object
 *                   description: Event type schema
 *                 enabled:
 *                   type: boolean
 *                   description: Event type enabled status
 *                 createdAt:
 *                   type: string
 *                   description: Created at
 *                 updatedAt:
 *                   type: string
 *                   description: Updated at
 *               example:
 *                 id: user.created
 *                 environmentId: a1b2
 *                 name: User Created
 *                 description: User created event
 *                 schema: { "type": "object", "properties": { "userId": { "type": "string" } }, "required": ["userId"] }
 *                 enabled: true
 *                 createdAt: 2021-01-01T00:00:00.000Z
 *                 updatedAt: 2021-01-01T00:00:00.000Z
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Event type not found"
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Event type ID is required"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Forbidden"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Internal server error"
 *     x-speakeasy-group: "eventTypes"
 *     x-speakeasy-name-override: "list"
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const authResult = await authenticateApiRequest(request, { eventTypes: ["read"] });
    
    if (!authResult.success) {
        return authResult.response;
    }

    const eventTypeId = params.id;

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
    

    // Format the response
    const formattedEventType = {
        id: existingEventType[0].id,
        environmentId: existingEventType[0].environmentId,
        name: existingEventType[0].name,
        description: existingEventType[0].description,
        schema: existingEventType[0].schema ? JSON.parse(existingEventType[0].schema) : null,
        enabled: existingEventType[0].enabled,
        createdAt: existingEventType[0].createdAt.toISOString(),
        updatedAt: existingEventType[0].updatedAt.toISOString()
    };

    return NextResponse.json({ formattedEventType });
}

/**
 * @swagger
 * /event-types/{id}:
 *   delete:
 *     summary: Delete Event Type
 *     description: Delete an event type
 *     tags:
 *       - Event Types
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Event type ID
 *         schema:
 *           type: string
 *         example:
 *           user.created
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message
 *                 deletedEventType:
 *                   type: object
 *                   description: Deleted event type
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Event type ID
 *                     name:
 *                       type: string
 *                       description: Event type name
 *               example:
 *                 message: "Event type deleted successfully"
 *                 deletedEventType: { id: "user.created", name: "User Created" }
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Event type ID is required"
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Event type not found"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Forbidden"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Internal server error"
 *     x-speakeasy-group: "eventTypes"
 *     x-speakeasy-name-override: "delete"
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
 * /event-types/{id}:
 *   patch:
 *     summary: Update Event Type
 *     description: Update an event type
 *     tags:
 *       - Event Types
 *     parameters:
 *       - name: id
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
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message
 *                 eventType:
 *                   type: object
 *                   description: Event type
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Event type ID
 *                     environmentId:
 *                       type: string
 *                       description: Environment ID
 *                     name:
 *                       type: string
 *                       description: Event type name
 *                     description:
 *                       type: string
 *                       description: Event type description
 *                     schema:
 *                       type: object
 *                       description: Event type schema
 *                     enabled:
 *                       type: boolean
 *                       description: Event type enabled status
 *                     createdAt:
 *                       type: string
 *                       description: Created at
 *                     updatedAt:
 *                       type: string
 *                       description: Updated at
 *               example:
 *                 message: "Event type updated successfully"
 *                 eventType: { id: "user.created", environmentId: "a1b2", name: "User Created", description: "User created event", schema: { "type": "object", "properties": { "userId": { "type": "string" } } }, enabled: true, createdAt: "2021-01-01T00:00:00.000Z", updatedAt: "2021-01-01T00:00:00.000Z" }
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Invalid schema"
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Event type not found"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Forbidden"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Internal server error"
 *     x-speakeasy-group: "eventTypes"
 *     x-speakeasy-name-override: "update"
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
        const body = await request.json() as {
            name?: string;
            description?: string;
            schema?: any;
            enabled?: boolean;
        };

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

        // Validate schema if provided
        if (body.schema !== undefined) {
            const schemaValidation = validateSchema(body.schema);
            if (!schemaValidation.valid) {
                return NextResponse.json({ 
                    error: "Invalid schema", 
                    details: schemaValidation.errors 
                }, { status: 400 });
            }
        }

        // Update the event type
        const updateData: any = {
            updatedAt: new Date()
        };

        // Only update fields that are provided
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.schema !== undefined) updateData.schema = JSON.stringify(body.schema);
        if (body.enabled !== undefined) updateData.enabled = body.enabled;

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
                enabled: updatedEventType[0].enabled,
                createdAt: updatedEventType[0].createdAt.toISOString(),
                updatedAt: updatedEventType[0].updatedAt.toISOString(),
            }
        });
    } catch (error) {
        console.error("Error updating event type:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
