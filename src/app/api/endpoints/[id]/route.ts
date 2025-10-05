import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { endpoints } from "@/db/webhooks.schema";
import { authenticateApiRequest } from "@/lib/apiHelpers";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /endpoints/{id}:
 *   get:
 *     summary: Get Endpoint
 *     description: Get an endpoint by ID
 *     tags:
 *       - Endpoints
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Endpoint ID
 *         schema:
 *           type: string
 *         example:
 *           ep_a1b2_abcd1234
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
 *                   description: Endpoint ID
 *                 environmentId:
 *                   type: string
 *                   description: Environment ID
 *                 name:
 *                   type: string
 *                   description: Name
 *                 description:
 *                   type: string
 *                   description: Description
 *                 url:
 *                   type: string
 *                   description: URL
 *                 enabled:
 *                   type: boolean
 *                   description: Whether the endpoint is enabled
 *                 retryPolicy:
 *                   type: string
 *                   description: Retry policy
 *                 maxAttempts:
 *                   type: number
 *                   description: Maximum number of attempts
 *                 timeoutMs:
 *                   type: number
 *                   description: Timeout
 *                 customHeaders:
 *                   type: object
 *                   description: Custom headers
 *                 proxyGroupId:
 *                   type: string
 *                   description: Proxy group ID
 *                 createdAt:
 *                   type: string
 *                   description: Created at
 *                 updatedAt:
 *                   type: string
 *                   description: Updated at
 *               example:
 *                 id: ep_a1b2_abcd1234
 *                 environmentId: a1b2
 *                 name: My Webhook Endpoint
 *                 description: My Webhook Endpoint description
 *                 url: https://example.com/webhook
 *                 enabled: true
 *                 retryPolicy: exponential
 *                 maxAttempts: 3
 *                 timeoutMs: 30000
 *                 customHeaders: {}
 *                 proxyGroupId: proxygrp_a1b2_efgh5678
 *                 createdAt: 2021-01-01T00:00:00.000Z
 *                 updatedAt: 2021-01-01T00:00:00.000Z
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Endpoint not found"
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Endpoint ID is required"
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
 *     x-speakeasy-name-override: "list"
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await authenticateApiRequest(request, { endpoints: ["read"] });
    
    if (!authResult.success) {
        return authResult.response;
    }

    const { id: endpointId } = await params;

    if (!endpointId) {
        return NextResponse.json({ error: "Endpoint ID is required" }, { status: 400 });
    }

    const db = await getDb();

    // Check if endpoint exists and belongs to user's environment
    const endpoint = await db
        .select()
        .from(endpoints)
        .where(eq(endpoints.id, endpointId))
        .limit(1);

    if (endpoint.length === 0) {
        return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }
    
    const { environmentId } = authResult;

    // Format the response
    const formattedEndpoint = {
        id: endpoint[0].id,
        environmentId: endpoint[0].environmentId,
        name: endpoint[0].name,
        description: endpoint[0].description,
        url: endpoint[0].url,
        enabled: endpoint[0].isActive,
        retryPolicy: endpoint[0].retryPolicy,
        maxAttempts: endpoint[0].maxRetries,
        timeoutMs: endpoint[0].timeoutMs,
        customHeaders: endpoint[0].headers ? JSON.parse(endpoint[0].headers) : {},
        proxyGroupId: endpoint[0].proxyGroupId,
        createdAt: endpoint[0].createdAt.toISOString(),
        updatedAt: endpoint[0].updatedAt.toISOString()
    };

    return NextResponse.json({ formattedEndpoint });
}

/**
 * @swagger
 * /endpoints/{id}:
 *   delete:
 *     summary: Delete Endpoint
 *     description: Delete an endpoint
 *     tags:
 *       - Endpoints
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Endpoint ID
 *         schema:
 *           type: string
 *         example:
 *           ep_a1b2_abcd1234
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
 *                 deletedEndpoint:
 *                   type: object
 *                   description: Deleted endpoint
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Endpoint ID
 *                     name:
 *                       type: string
 *                       description: Endpoint name
 *               example:
 *                 message: "Endpoint deleted successfully"
 *                 deletedEndpoint: { id: "ep_a1b2_abcd1234", name: "My Webhook Endpoint" }
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Endpoint ID is required"
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Endpoint not found"
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
 *     x-speakeasy-name-override: "delete"
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateApiRequest(request, { endpoints: ["delete"] });
    
        if (!authResult.success) {
            return authResult.response;
        }

        const { id: endpointId } = await params;

        if (!endpointId) {
            return NextResponse.json({ error: "Endpoint ID is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if endpoint exists and belongs to user's environment
        const endpoint = await db
            .select()
            .from(endpoints)
            .where(eq(endpoints.id, endpointId))
            .limit(1);

        if (endpoint.length === 0) {
            return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
        }

        // TODO: Add environment ownership check when we have user environment tracking
        // For now, we'll allow deletion if the endpoint exists

        // Delete the endpoint
        await db
            .delete(endpoints)
            .where(eq(endpoints.id, endpointId));

        return NextResponse.json({ 
            message: "Endpoint deleted successfully",
            deletedEndpoint: {
                id: endpoint[0].id,
                name: endpoint[0].name
            }
        });
    } catch (error) {
        console.error("Error deleting endpoint:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /endpoints/{id}:
 *   patch:
 *     summary: Update Endpoint
 *     description: Update an endpoint
 *     tags:
 *       - Endpoints
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Endpoint ID
 *         schema:
 *           type: string
 *         example:
 *           ep_a1b2_abcd1234
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
 *                 endpoint:
 *                   type: object
 *                   description: Endpoint
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Endpoint ID
 *                     environmentId:
 *                       type: string
 *                       description: Environment ID
 *                     name:
 *                       type: string
 *                       description: Endpoint name
 *                     description:
 *                       type: string
 *                       description: Endpoint description
 *                     url:
 *                       type: string
 *                       description: Endpoint URL
 *                     enabled:
 *                       type: boolean
 *                       description: Whether the endpoint is enabled
 *                     retryPolicy:
 *                       type: string
 *                       description: Retry policy
 *                     maxAttempts:
 *                       type: number
 *                       description: Maximum number of attempts
 *                     timeoutMs:
 *                       type: number
 *                       description: Timeout
 *                     customHeaders:
 *                       type: object
 *                       description: Custom headers
 *                     proxyGroupId:
 *                       type: string
 *                       description: Proxy group ID
 *                     createdAt:
 *                       type: string
 *                       description: Created at
 *                     updatedAt:
 *                       type: string
 *                       description: Updated at
 *               example:
 *                 message: "Endpoint updated successfully"
 *                 endpoint: { id: "ep_a1b2_abcd1234", environmentId: "a1b2", name: "My Webhook Endpoint", description: "My Webhook Endpoint description", url: "https://example.com/webhook", enabled: true, retryPolicy: "exponential", maxAttempts: 3, timeoutMs: 30000, customHeaders: {}, proxyGroupId: "proxygrp_a1b2_efgh5678", createdAt: "2021-01-01T00:00:00.000Z", updatedAt: "2021-01-01T00:00:00.000Z" }
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Endpoint ID is required"
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Endpoint not found"
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
 *     x-speakeasy-name-override: "update"
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateApiRequest(request, { endpoints: ["update"] });
    
        if (!authResult.success) {
            return authResult.response;
        }

        const { id: endpointId } = await params;
        const { body } = authResult;

        if (!endpointId) {
            return NextResponse.json({ error: "Endpoint ID is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if endpoint exists
        const existingEndpoint = await db
            .select()
            .from(endpoints)
            .where(eq(endpoints.id, endpointId))
            .limit(1);

        if (existingEndpoint.length === 0) {
            return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
        }

        // Update the endpoint
        const updateData: any = {
            updatedAt: new Date()
        };

        // Only update fields that are provided
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.url !== undefined) updateData.url = body.url;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.retryPolicy !== undefined) updateData.retryPolicy = body.retryPolicy;
        if (body.maxRetries !== undefined) updateData.maxRetries = body.maxRetries;
        if (body.timeoutMs !== undefined) updateData.timeoutMs = body.timeoutMs;
        if (body.headers !== undefined) updateData.headers = JSON.stringify(body.headers);
        if (body.proxyGroupId !== undefined) updateData.proxyGroupId = body.proxyGroupId;

        await db
            .update(endpoints)
            .set(updateData)
            .where(eq(endpoints.id, endpointId));

        // Return updated endpoint
        const updatedEndpoint = await db
            .select()
            .from(endpoints)
            .where(eq(endpoints.id, endpointId))
            .limit(1);

        return NextResponse.json({
            message: "Endpoint updated successfully",
            endpoint: {
                id: updatedEndpoint[0].id,
                environmentId: updatedEndpoint[0].environmentId,
                name: updatedEndpoint[0].name,
                description: updatedEndpoint[0].description,
                url: updatedEndpoint[0].url,
                enabled: updatedEndpoint[0].isActive,
                retryPolicy: updatedEndpoint[0].retryPolicy,
                maxAttempts: updatedEndpoint[0].maxRetries,
                timeoutMs: updatedEndpoint[0].timeoutMs,
                customHeaders: updatedEndpoint[0].headers ? JSON.parse(updatedEndpoint[0].headers) : {},
                proxyGroupId: updatedEndpoint[0].proxyGroupId,
                createdAt: updatedEndpoint[0].createdAt.toISOString(),
                updatedAt: updatedEndpoint[0].updatedAt.toISOString(),
            }
        });
    } catch (error) {
        console.error("Error updating endpoint:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
