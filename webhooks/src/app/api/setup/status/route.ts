import { getDb } from "@/db";
import { users } from "@/db/auth.schema";
import { NextResponse } from "next/server";

// GET /api/setup/status - Check if setup is needed (no auth required)
export async function GET() {
    try {
        const db = await getDb();

        // Check if any users exist
        const existingUsers = await db
            .select({ id: users.id })
            .from(users)
            .limit(1);

        const needsSetup = existingUsers.length === 0;

        return NextResponse.json({
            needsSetup,
            userCount: existingUsers.length,
        });

    } catch (error) {
        console.error("Error checking setup status:", error);
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 });
    }
}
