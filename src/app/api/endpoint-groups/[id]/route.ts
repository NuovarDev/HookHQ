import { getDb } from "@/db";
import { endpointGroups } from "@/db/webhooks.schema";
import { authenticateApiRequest } from "@/lib/apiHelpers";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /endpoint-groups/{id}:
 *   get:
 *     summary: Get Endpoint Group
 *     description: Get an endpoint group by ID
 *     tags:
 *       - Endpoint Groups
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Endpoint group ID
 *         schema:
 *           type: string
 *         example:
 *           grp_a1b2_efgh5678
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
 *                   description: Endpoint group name
 *                 description:
 *                   type: string
 *                   description: Endpoint group description
 *                 endpointIds:
 *                   type: array
 *                   description: Endpoint IDs
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
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Endpoint group not found"
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Group ID is required"
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiRequest(request, { endpointGroups: ["read"] });
    
    if (!authResult.success) {
        return authResult.response;
    }

    const { id: groupId } = await params;

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

    // Format the response
    const formattedGroup = {
        id: existingGroup[0].id,
        environmentId: existingGroup[0].environmentId,
        name: existingGroup[0].name,
        description: existingGroup[0].description,
        endpointIds: JSON.parse(existingGroup[0].endpointIds),
        enabled: existingGroup[0].isActive,
        createdAt: existingGroup[0].createdAt.toISOString(),
        updatedAt: existingGroup[0].updatedAt.toISOString()
    };

    return NextResponse.json({ formattedGroup });
}

/**
 * @swagger
 * /endpoint-groups/{id}:
 *   delete:
 *     summary: Delete Endpoint Group
 *     description: Delete an endpoint group
 *     tags:
 *       - Endpoint Groups
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Endpoint group ID
 *         schema:
 *           type: string
 *         example:
 *           grp_a1b2_efgh5678
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
 *                 deletedGroup:
 *                   type: object
 *                   description: Deleted endpoint group
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Endpoint group ID
 *                     name:
 *                       type: string
 *                       description: Endpoint group name
 *               example:
 *                 message: "Endpoint group deleted successfully"
 *                 deletedGroup: { id: "grp_a1b2_efgh5678", name: "My Endpoint Group" }
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Group ID is required"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Forbidden"
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Endpoint group not found"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Internal server error"
 *     x-speakeasy-group: "endpointGroups"
 *     x-speakeasy-name-override: "delete"
 *   
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateApiRequest(request, { endpointGroups: ["delete"] });
    
        if (!authResult.success) {
            return authResult.response;
        }

        const { id: groupId } = await params;

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
 *     summary: Update Endpoint Group
 *     description: Update an endpoint group
 *     tags:
 *       - Endpoint Groups
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Endpoint group ID
 *         schema:
 *           type: string
 *         example:
 *           grp_a1b2_efgh5678
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
 *                 group:
 *                   type: object
 *                   description: Endpoint group
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Endpoint group ID
 *                     environmentId:
 *                       type: string
 *                       description: Environment ID
 *                     name:
 *                       type: string
 *                       description: Endpoint group name
 *                     description:
 *                       type: string
 *                       description: Endpoint group description
 *                     endpointIds:
 *                       type: array
 *                       description: Endpoint IDs
 *                     enabled:
 *                       type: boolean
 *                       description: Whether the endpoint group is enabled
 *                     createdAt:
 *                       type: string
 *                       description: Created at
 *                     updatedAt:
 *                       type: string
 *                       description: Updated at
 *               example:
 *                 message: "Endpoint group updated successfully"
 *                 group: { id: "grp_a1b2_efgh5678", environmentId: "a1b2", name: "My Endpoint Group", description: "My Endpoint Group description", endpointIds: ["ep_a1b2_efgh5678"], enabled: true, createdAt: "2021-01-01T00:00:00.000Z", updatedAt: "2021-01-01T00:00:00.000Z" }
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Group ID is required"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Forbidden"
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Endpoint group not found"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Internal server error"
 *     x-speakeasy-group: "endpointGroups"
 *     x-speakeasy-name-override: "update"
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateApiRequest(request, { endpointGroups: ["update"] });
    
        if (!authResult.success) {
            return authResult.response;
        }

        const { id: groupId } = await params;
        const { body } = authResult;

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
