import { getDb } from "@/db";
import { endpointGroups } from "@/db/webhooks.schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiHelpers";

/**
 * @swagger
 * /endpoint-groups:
 *   get:
 *     summary: List Endpoint Groups
 *     description: List endpoint groups for the current environment
 *     tags:
 *       - Endpoint Groups
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 endpointGroups:
 *                   type: array
 *                   description: List of endpoint groups
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Endpoint group ID
 *                       environmentId:
 *                         type: string
 *                         description: Environment ID
 *                       name:
 *                         type: string
 *                         description: Name
 *                       description:
 *                         type: string
 *                         description: Description
 *                       endpointIds:
 *                         type: array
 *                         description: List of endpoint IDs
 *                       enabled:
 *                         type: boolean
 *                         description: Whether the endpoint group is enabled
 *                       createdAt:
 *                         type: string
 *                         description: Created at
 *                       updatedAt:
 *                         type: string
 *                         description: Updated at
 *               example:
 *                 endpointGroups:
 *                   - id: grp_a1b2_efgh5678
 *                     environmentId: a1b2
 *                     name: My Endpoint Group
 *                     description: My Endpoint Group description
 *                     endpointIds: ["ep_a1b2_efgh5678"]
 *                     enabled: true
 *                     createdAt: 2021-01-01T00:00:00.000Z
 *                     updatedAt: 2021-01-01T00:00:00.000Z
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
 *     x-speakeasy-group: "endpointGroups"
 *     x-speakeasy-name-override: "list"
 */
export async function GET(request: NextRequest) {
    const authResult = await authenticateApiRequest(request, { endpointGroups: ["read"] });
    
    if (!authResult.success) {
        return authResult.response;
    }
    
    const { environmentId } = authResult;

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
        const db = await getDb();
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
}

/**
 * @swagger
 * /endpoint-groups:
 *   post:
 *     summary: Create Endpoint Group
 *     description: Create new endpoint group
 *     tags:
 *       - Endpoint Groups
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["name"]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the endpoint group
 *                 example: My Endpoint Group
 *               description:
 *                 type: string
 *                 description: Description of the endpoint group
 *                 example: My Endpoint Group description
 *               endpointIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of endpoint IDs
 *                 example: ["ep_a1b2_efgh5678"]
 *               enabled:
 *                 type: boolean
 *                 description: Whether the endpoint group is enabled
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
 *                   description: Endpoint group ID
 *                 environmentId:
 *                   type: string
 *                   description: Environment ID
 *                 name:
 *                   type: string
 *                   description: Name
 *                 description:
 *                   type: string
 *                   description: Description
 *                 endpointIds:
 *                   type: array
 *                   description: List of endpoint IDs
 *                   items:
 *                     type: string
 *                 enabled:
 *                   type: boolean
 *                   description: Whether the endpoint group is enabled
 *                 createdAt:
 *                   type: string
 *                   description: Created at
 *                 updatedAt:
 *                   type: string
 *                   description: Updated at
 *               example:
 *                 id: grp_a1b2_efgh5678
 *                 environmentId: a1b2
 *                 name: My Endpoint Group
 *                 description: My Endpoint Group description
 *                 endpointIds: ["ep_a1b2_efgh5678"]
 *                 enabled: true
 *                 createdAt: 2021-01-01T00:00:00.000Z
 *                 updatedAt: 2021-01-01T00:00:00.000Z
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Name is required"
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
 *     x-speakeasy-group: "endpointGroups"
 *     x-speakeasy-name-override: "create"
 */
export async function POST(request: NextRequest) {
    const authResult = await authenticateApiRequest(request, { endpointGroups: ["create"] });
    
    if (!authResult.success) {
        return authResult.response;
    }
    
    const { environmentId, body } = authResult;

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

        const db = await getDb();
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
}
