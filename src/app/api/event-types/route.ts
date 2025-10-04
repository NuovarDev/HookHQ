import { getDb } from "@/db";
import { eventTypes } from "@/db/webhooks.schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiHelpers";
import { validateSchema } from "@/lib/schemaValidation";

/**
 * @swagger
 * /event-types:
 *   get:
 *     summary: List Event Types
 *     description: List event types for the current environment
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
 *                 eventTypes:
 *                   type: array
 *                   description: List of event types
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Event type ID
 *                       environmentId:
 *                         type: string
 *                         description: Environment ID
 *                       name:
 *                         type: string
 *                         description: Event type name
 *                       description:
 *                         type: string
 *                         description: Event type description
 *                       schema:
 *                         type: object
 *                         description: JSON Schema for event payload validation (must be valid JSON Schema)
 *                       enabled:
 *                         type: boolean
 *                         description: Whether the event type is enabled
 *                       createdAt:
 *                         type: string
 *                         description: Created at
 *                       updatedAt:
 *                         type: string
 *                         description: Updated at
 *                     example:
 *                       id: user.created
 *                       environmentId: a1b2
 *                       name: User Created
 *                       description: User created event
 *                       schema: { "type": "object", "properties": { "userId": { "type": "string" } }, "required": ["userId"] }
 *                       enabled: true
 *                       createdAt: 2021-01-01T00:00:00.000Z
 *                       updatedAt: 2021-01-01T00:00:00.000Z
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
export async function GET(request: NextRequest) {
    const authResult = await authenticateApiRequest(request, { eventTypes: ["read"] });
    
    if (!authResult.success) {
        return authResult.response;
    }
    
    const { environmentId } = authResult;

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
        const db = await getDb();
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
}

/**
 * @swagger
 * /event-types:
 *   post:
 *     summary: Create Event Type
 *     description: Create new event type
 *     tags:
 *       - Event Types
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["name"]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the event type
 *                 example: User Created
 *               description:
 *                 type: string
 *                 description: Description of the event type
 *                 example: User created event
 *               schema:
 *                 type: object
 *                 description: JSON Schema for event payload validation (must be valid JSON Schema)
 *                 example: |
 *                    {
 *                      "type": "object",
 *                      "properties": {
 *                        "userId": {
 *                          "type": "string"
 *                        }
 *                      },
 *                      "required": ["userId"]
 *                    }
 *               enabled:
 *                 type: boolean
 *                 description: Whether the event type is enabled
 *                 example: true
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
 *                   description: JSON Schema for event payload validation (must be valid JSON Schema)
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Invalid schema"
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
 *     x-speakeasy-name-override: "create"
 */
export async function POST(request: NextRequest) {
    const authResult = await authenticateApiRequest(request, { eventTypes: ["create"] });
    
    if (!authResult.success) {
        return authResult.response;
    }
    
    const { environmentId, body } = authResult;

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

        // Validate schema if provided
        if (schema) {
            const schemaValidation = validateSchema(schema);
            if (!schemaValidation.valid) {
                return NextResponse.json({ 
                    error: "Invalid schema", 
                    details: schemaValidation.errors 
                }, { status: 400 });
            }
        }

        // Generate event type ID (environmentId + random string)
        const eventTypeId = `${environmentId}_${crypto.randomUUID().substring(0, 8)}`;
        const now = new Date();

        const db = await getDb();
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
}
