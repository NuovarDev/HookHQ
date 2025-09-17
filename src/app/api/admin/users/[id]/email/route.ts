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
        const { email } = body as { email: string };

        if (!email || !email.trim()) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
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

        // Check if email is already taken by another user
        const emailExists = await db
            .select()
            .from(users)
            .where(eq(users.email, email.trim()))
            .limit(1);

        if (emailExists.length > 0 && emailExists[0].id !== userId) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        // Update user email using Better Auth
        const updateResult = await authInstance.api.updateUser({
            headers: await headers(),
            body: {
                id: userId,
                email: email.trim(),
            },
        });

        if (!updateResult) {
            return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "Email updated successfully",
            user: {
                id: updateResult.id,
                email: updateResult.email,
                name: updateResult.name,
            }
        });
    } catch (error) {
        console.error("Error updating user email:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
