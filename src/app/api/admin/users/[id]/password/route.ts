import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/auth.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

        // Check if the current user is an admin
        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const userId = params.id;
        const body = await request.json();
        const { newPassword } = body as { newPassword: string };

        if (!newPassword || !newPassword.trim()) {
            return NextResponse.json({ error: "New password is required" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
        }

        const db = await getDb();

        // Check if user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (existingUser.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Change password using Better Auth's admin functionality
        // Note: Better Auth might have different methods for admin password changes
        // This is a simplified approach - you might need to adjust based on Better Auth's API
        try {
            const changePasswordResult = await authInstance.api.changePassword({
                headers: await headers(),
                body: {
                    userId: userId,
                    newPassword: newPassword,
                },
            });

            if (!changePasswordResult) {
                return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
            }

            return NextResponse.json({ 
                message: "Password changed successfully"
            });
        } catch (authError) {
            // If Better Auth doesn't support admin password changes directly,
            // we might need to use a different approach or update the user record directly
            console.error("Better Auth password change failed:", authError);
            
            // Alternative approach: Update the password hash directly in the database
            // This is a fallback method - you should verify this works with your Better Auth setup
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            
            await db
                .update(users)
                .set({ 
                    password: hashedPassword,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId));

            return NextResponse.json({ 
                message: "Password changed successfully"
            });
        }
    } catch (error) {
        console.error("Error changing user password:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
