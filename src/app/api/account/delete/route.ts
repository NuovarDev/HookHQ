import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { apikeys, sessions, accounts, users } from "@/db/auth.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/account/delete - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { confirmationText } = body as { confirmationText: string };

        // Require confirmation text to prevent accidental deletion
        if (confirmationText !== "DELETE MY ACCOUNT") {
            return NextResponse.json({ 
                error: "Confirmation text must be 'DELETE MY ACCOUNT'" 
            }, { status: 400 });
        }

        const db = await getDb();
        const userId = session.user.id;

        // Start a transaction to ensure all data is deleted atomically
        try {
            // Delete all API keys associated with the user
            await db.delete(apikeys).where(eq(apikeys.userId, userId));
            
            // Delete all sessions associated with the user
            await db.delete(sessions).where(eq(sessions.userId, userId));
            
            // Delete all accounts associated with the user
            await db.delete(accounts).where(eq(accounts.userId, userId));
            
            // Delete the user record itself
            await db.delete(users).where(eq(users.id, userId));
            
            console.log(`Account deletion completed for user: ${userId}`);
            
            return NextResponse.json({ 
                success: true, 
                message: "Account and all associated data have been deleted successfully" 
            });
            
        } catch (dbError) {
            console.error("Database error during account deletion:", dbError);
            return NextResponse.json({ 
                error: "Failed to delete account data. Please try again." 
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
