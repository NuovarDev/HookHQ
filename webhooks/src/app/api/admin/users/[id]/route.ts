import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/auth.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/users/[id] - Update user
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

        // TODO: Check if user is admin

        const body = await request.json() as { isActive: boolean; role: string };
        const { isActive, role } = body;

        const db = await getDb();

        // TODO: Update user status and role
        // For now, we'll just return success since we don't have these fields yet

        return NextResponse.json({ 
            success: true,
            message: "User updated successfully" 
        });

    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id] - Delete user
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

        // TODO: Check if user is admin
        // TODO: Prevent deletion of admin users
        // TODO: Prevent deletion of the current user

        const userId = params.id;

        if (userId === session.user.id) {
            return NextResponse.json({ 
                error: "Cannot delete your own account" 
            }, { status: 400 });
        }

        const db = await getDb();

        // TODO: Delete user from database
        // For now, we'll just return success

        return NextResponse.json({ 
            success: true,
            message: "User deleted successfully" 
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
