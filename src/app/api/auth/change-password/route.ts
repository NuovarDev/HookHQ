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
        const { currentPassword, newPassword } = body as { 
            currentPassword: string; 
            newPassword: string; 
        };

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 });
        }

        // Change password using Better Auth
        const changePasswordResult = await authInstance.api.changePassword({
            headers: await headers(),
            body: {
                currentPassword,
                newPassword,
            },
        });

        if (!changePasswordResult) {
            return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
        }

        return NextResponse.json({ 
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Error changing password:", error);
        
        // Check if it's a validation error from Better Auth
        if (error instanceof Error && error.message.includes("Invalid current password")) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
        
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
