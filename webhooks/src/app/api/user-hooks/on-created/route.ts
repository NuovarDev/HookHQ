import { initAuth } from "@/auth";
import { createDefaultApiKey } from "@/lib/userSetup";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/user-hooks/on-created - Create default API key for new user
export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json() as { userId: string; userData: { name: string; email: string } };
        const { userId, userData } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Verify the user ID matches the current session
        if (userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Create default API key
        const defaultKey = await createDefaultApiKey(userId, userData?.name);

        return NextResponse.json({
            success: true,
            apiKey: defaultKey,
        });
    } catch (error) {
        console.error("Error creating default API key:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
