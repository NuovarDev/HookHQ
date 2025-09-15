import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/config - Get server configuration
export async function GET() {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Check if user is admin
        // For now, we'll allow any authenticated user to access admin config
        // In production, you should implement proper admin role checking

        const db = await getDb();
        
        // Get server configuration (we'll create this table later)
        // For now, return default configuration
        const defaultConfig = {
            id: "default",
            cloudflareApiKey: null,
            cloudflareAccountId: null,
            logRetentionDays: 30,
            payloadRetentionDays: 7,
            defaultMaxRetries: 3,
            defaultTimeoutMs: 30000,
            defaultBackoffStrategy: "exponential",
            queueManagementEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ config: defaultConfig });
    } catch (error) {
        console.error("Error fetching server config:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admin/config - Update server configuration
export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Check if user is admin
        // For now, we'll allow any authenticated user to update admin config

        const body = await request.json() as {
            cloudflareApiKey: string;
            cloudflareAccountId: string;
            logRetentionDays: string;
            payloadRetentionDays: string;
            defaultMaxRetries: string;
            defaultTimeoutMs: string;
            defaultBackoffStrategy: string;
            queueManagementEnabled: string;
        };
        const {
            cloudflareApiKey,
            cloudflareAccountId,
            logRetentionDays,
            payloadRetentionDays,
            defaultMaxRetries,
            defaultTimeoutMs,
            defaultBackoffStrategy,
            queueManagementEnabled,
        } = body;

        // TODO: Save to database
        // For now, return the updated configuration
        const updatedConfig = {
            id: "default",
            cloudflareApiKey,
            cloudflareAccountId,
            logRetentionDays: parseInt(logRetentionDays),
            payloadRetentionDays: parseInt(payloadRetentionDays),
            defaultMaxRetries: parseInt(defaultMaxRetries),
            defaultTimeoutMs: parseInt(defaultTimeoutMs),
            defaultBackoffStrategy,
            queueManagementEnabled: Boolean(queueManagementEnabled),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ config: updatedConfig });
    } catch (error) {
        console.error("Error updating server config:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
