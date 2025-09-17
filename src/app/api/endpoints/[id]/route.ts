import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { endpoints } from "@/db/webhooks.schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /endpoints/{id}:
 *   delete:
 *     description: Delete an endpoint
 *     tags:
 *       - Endpoints
 *     responses:
 *       200:
 *         description: Endpoint deleted
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

        const endpointId = params.id;

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
 *     description: Update an endpoint
 *     tags:
 *       - Endpoints
 *     responses:
 *       200:
 *         description: Endpoint updated
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

        const endpointId = params.id;
        const body = await request.json();

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
