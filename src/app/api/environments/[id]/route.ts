import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { environments } from "@/db/environments.schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/environments/[id] - Delete an environment
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

        const environmentId = params.id;

        if (!environmentId) {
            return NextResponse.json({ error: "Environment ID is required" }, { status: 400 });
        }

        const db = await getDb();

        // Check if environment exists
        const environment = await db
            .select()
            .from(environments)
            .where(eq(environments.id, environmentId))
            .limit(1);

        if (environment.length === 0) {
            return NextResponse.json({ error: "Environment not found" }, { status: 404 });
        }

        // Prevent deletion of default environment
        if (environment[0].isDefault) {
            return NextResponse.json({ 
                error: "Cannot delete default environment" 
            }, { status: 400 });
        }

        // Delete the environment
        await db
            .delete(environments)
            .where(eq(environments.id, environmentId));

        return NextResponse.json({ 
            message: "Environment deleted successfully",
            deletedEnvironment: {
                id: environment[0].id,
                name: environment[0].name
            }
        });
    } catch (error) {
        console.error("Error deleting environment:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
