import { initAuth } from "@/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body as { name: string };

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Update user profile using Better Auth
        const updateResult = await authInstance.api.updateUser({
            headers: await headers(),
            body: {
                name: name.trim(),
            },
        });

        if (!updateResult) {
            return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "User updated successfully",
            user: {
                id: updateResult.id,
                name: updateResult.name,
                email: updateResult.email,
            }
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
