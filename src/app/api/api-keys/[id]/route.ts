import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { apikeys } from "@/db/auth.schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/api-keys/[id] - Delete API key
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

        // Use Better Auth API key plugin if available, otherwise fallback to direct DB access
        try {
            // Try to use Better Auth API key plugin methods
            await authInstance.api.deleteApiKey({ 
                headers: await headers(),
                body: { keyId: params.id }
            });
            return NextResponse.json({ success: true });
        } catch (pluginError) {
            console.log("API key plugin not available, using direct DB access");
            
            // Fallback to direct database access
            const db = await getDb();
            
            // Verify the API key belongs to the user
            const existingKey = await db
                .select()
                .from(apikeys)
                .where(and(
                    eq(apikeys.id, params.id),
                    eq(apikeys.userId, session.user.id)
                ))
                .limit(1);

            if (existingKey.length === 0) {
                return NextResponse.json({ error: "API key not found" }, { status: 404 });
            }

            // Delete the API key
            await db
                .delete(apikeys)
                .where(and(
                    eq(apikeys.id, params.id),
                    eq(apikeys.userId, session.user.id)
                ));

            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("Error deleting API key:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/api-keys/[id] - Update API key (toggle enabled/disabled)
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

        const body = await request.json();
        const { enabled } = body as { enabled: boolean };

        if (typeof enabled !== "boolean") {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        // Use Better Auth API key plugin if available, otherwise fallback to direct DB access
        try {
            // Try to use Better Auth API key plugin methods
            await authInstance.api.updateApiKey({ 
                headers: await headers(),
                body: { keyId: params.id, enabled }
            });
            return NextResponse.json({ success: true });
        } catch (pluginError) {
            console.log("API key plugin not available, using direct DB access");
            
            // Fallback to direct database access
            const db = await getDb();
            
            // Verify the API key belongs to the user
            const existingKey = await db
                .select()
                .from(apikeys)
                .where(and(
                    eq(apikeys.id, params.id),
                    eq(apikeys.userId, session.user.id)
                ))
                .limit(1);

            if (existingKey.length === 0) {
                return NextResponse.json({ error: "API key not found" }, { status: 404 });
            }

            // Update the API key
            await db
                .update(apikeys)
                .set({ 
                    enabled,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(apikeys.id, params.id),
                    eq(apikeys.userId, session.user.id)
                ));

            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("Error updating API key:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
