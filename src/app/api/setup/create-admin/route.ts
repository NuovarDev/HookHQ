import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/auth.schema";
import { environments } from "@/db/environments.schema";
import { apikeys } from "@/db/auth.schema";
import { generateEnvironmentId } from "@/lib/initEnvironments";
import { generateApiKey, generateApiKeyId, serializePermissions, getDefaultPermissions } from "@/lib/apiKeys";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// POST /api/setup/create-admin - Create first admin user (no auth required)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            email: string;
            name: string;
            password: string;
        };
        const { email, name, password } = body;

        if (!email || !name || !password) {
            return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        // Validate password length
        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
        }

        const db = await getDb();

        // Check if any users already exist
        const existingUsers = await db
            .select({ id: users.id })
            .from(users)
            .limit(1);

        if (existingUsers.length > 0) {
            return NextResponse.json({ 
                error: "Users already exist. This endpoint is only for first-time setup." 
            }, { status: 400 });
        }

        // Check if user with this email already exists
        const existingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }

        // Initialize auth and create user
        const authInstance = await initAuth();
        
        const result = await authInstance.api.signUpEmail({
            body: {
                email,
                password,
                name,
            }
        });

        const newUser = result.user;
        console.log(`✅ First admin user created: ${email}`);

        // Check if environments exist, if not create default environment
        const existingEnvironments = await db
            .select({ id: environments.id })
            .from(environments)
            .limit(1);

        let environmentId: string;

        const now = new Date();

        if (existingEnvironments.length === 0) {
            // Create default environment
            environmentId = generateEnvironmentId();

            await db.insert(environments).values({
                id: environmentId,
                name: "Production",
                description: "Default production environment",
                isDefault: true,
                createdAt: now,
                updatedAt: now,
            });

            console.log(`✅ Default environment created: ${environmentId}`);
        } else {
            // Use existing environment
            environmentId = existingEnvironments[0].id;
            console.log(`✅ Using existing environment: ${environmentId}`);
        }

        // Create default API key for the admin user
        const apiKeyId = generateApiKeyId();
        const apiKey = generateApiKey();

        await db.insert(apikeys).values({
            id: apiKeyId,
            name: `${name}'s Default Key`,
            metadata: JSON.stringify({ environment: environmentId }),
            key: apiKey,
            userId: newUser.id,
            permissions: serializePermissions(getDefaultPermissions()),
            enabled: true,
            createdAt: now,
            updatedAt: now,
        });

        console.log(`✅ Default API key created for admin user`);

        // Set user's last environment
        await db
            .update(users)
            .set({ lastEnvironment: environmentId })
            .where(eq(users.id, newUser.id));

        console.log(`✅ Admin user setup completed successfully`);

        // Get environment name for response
        const environment = await db
            .select({ name: environments.name })
            .from(environments)
            .where(eq(environments.id, environmentId))
            .limit(1);

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
            environment: {
                id: environmentId,
                name: environment[0]?.name || "Unknown",
            },
            apiKey: {
                id: apiKeyId,
                key: apiKey, // Only returned during setup
            }
        });

    } catch (error) {
        console.error("Error creating first admin user:", error);
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 });
    }
}
