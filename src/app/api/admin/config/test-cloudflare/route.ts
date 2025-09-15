import { initAuth } from "@/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/config/test-cloudflare - Test Cloudflare API connection
export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: Check if user is admin

        const body = await request.json() as { apiKey: string; accountId: string };
        const { apiKey, accountId } = body;

        if (!apiKey || !accountId) {
            return NextResponse.json({ error: "API key and Account ID are required" }, { status: 400 });
        }

        // Test Cloudflare API connection
        try {
            const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json() as { errors: { message: string }[] };
                return NextResponse.json({ 
                    error: `Cloudflare API error: ${errorData.errors?.[0]?.message || 'Unknown error'}` 
                }, { status: 400 });
            }

            const data = await response.json() as { result: { name: string } };
            return NextResponse.json({ 
                success: true, 
                account: data.result?.name || "Unknown Account" 
            });

        } catch (fetchError) {
            console.error("Cloudflare API test error:", fetchError);
            return NextResponse.json({ 
                error: "Failed to connect to Cloudflare API" 
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error testing Cloudflare connection:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
