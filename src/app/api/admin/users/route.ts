import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/auth.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

// GET /api/admin/users - List all users
export async function GET() {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Check if user is admin
        // For now, we'll allow any authenticated user to access user management

        const db = await getDb();
        const allUsers = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .orderBy(users.createdAt);

        // Format the response
        const formattedUsers = allUsers.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: "user", // TODO: Add role field to users table
            isActive: true, // TODO: Add isActive field to users table
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            lastLoginAt: null, // TODO: Add lastLoginAt field to users table
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Check if user is admin

        const body = await request.json() as {
            email: string;
            name: string;
            role: string;
            sendInviteEmail: boolean;
        };
        const { email, name, role = "user", sendInviteEmail = true } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if user already exists
        const existingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }

        // Generate a temporary password (user will need to reset it on first login)
        const tempPassword = randomBytes(12).toString('hex');
        const now = new Date();

        // Create user using Better Auth
        try {
            const newUser = await authInstance.api.signUpEmail({
                headers: await headers(),
                body: {
                    email,
                    password: tempPassword,
                    name: name || "",
                }
            });

            // TODO: Send invitation email if sendInviteEmail is true
            // TODO: Store role and other metadata

            return NextResponse.json({
                user: {
                    id: newUser.user.id,
                    email: newUser.user.email,
                    name: newUser.user.name,
                    role,
                    isActive: true,
                    createdAt: now.toISOString(),
                    updatedAt: now.toISOString(),
                    lastLoginAt: null,
                }
            });

        } catch (authError) {
            console.error("Error creating user:", authError);
            return NextResponse.json({ 
                error: "Failed to create user account" 
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
