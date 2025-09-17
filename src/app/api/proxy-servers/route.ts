import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { proxyServers } from "@/db/webhooks.schema";
import { users } from "@/db/auth.schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateEnvironmentId } from "@/lib/initEnvironments";
import { randomBytes } from "crypto";


export async function GET(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current environment from user's last environment
        const db = await getDb();
        const user = await db
            .select({ lastEnvironment: users.lastEnvironment })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user[0]?.lastEnvironment) {
            return NextResponse.json({ error: "No environment selected" }, { status: 400 });
        }

        const environmentId = user[0].lastEnvironment;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const active = searchParams.get("active");

        // Build query conditions
        const conditions = [eq(proxyServers.environmentId, environmentId)];
        
        // Add active filter if provided
        if (active !== null) {
            conditions.push(eq(proxyServers.isActive, active === "true"));
        }

        // Execute query
        const proxyList = await db
            .select()
            .from(proxyServers)
            .where(and(...conditions))
            .orderBy(proxyServers.createdAt);

        // Format the response (exclude secret for security)
        const formattedProxies = proxyList.map(proxy => ({
            id: proxy.id,
            environmentId: proxy.environmentId,
            name: proxy.name,
            description: proxy.description,
            url: proxy.url,
            isActive: proxy.isActive,
            region: proxy.region,
            provider: proxy.provider,
            staticIp: proxy.staticIp,
            healthCheckUrl: proxy.healthCheckUrl,
            timeoutMs: proxy.timeoutMs,
            maxConcurrentRequests: proxy.maxConcurrentRequests,
            createdAt: proxy.createdAt.toISOString(),
            updatedAt: proxy.updatedAt.toISOString()
        }));

        return NextResponse.json({ proxyServers: formattedProxies });
    } catch (error) {
        console.error("Error fetching proxy servers:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/proxy-servers - Create new proxy server
export async function POST(request: NextRequest) {
    try {
        const authInstance = await initAuth();
        const session = await authInstance.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current environment from user's last environment
        const db = await getDb();
        const user = await db
            .select({ lastEnvironment: users.lastEnvironment })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        if (!user[0]?.lastEnvironment) {
            return NextResponse.json({ error: "No environment selected" }, { status: 400 });
        }

        const environmentId = user[0].lastEnvironment;

        const body = await request.json();
        const { 
            name, 
            description, 
            url, 
            region, 
            provider, 
            staticIp,
            healthCheckUrl,
            timeoutMs = 30000,
            maxConcurrentRequests = 100,
            isActive = true
        } = body as {
            name: string;
            description?: string;
            url: string;
            region?: string;
            provider?: string;
            staticIp?: string;
            healthCheckUrl?: string;
            timeoutMs?: number;
            maxConcurrentRequests?: number;
            isActive?: boolean;
        };

        if (!name || !url) {
            return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        // Generate proxy server ID with prefix and secret
        const proxyId = `proxy_${environmentId}_${crypto.randomUUID().substring(0, 8)}`;
        const secret = randomBytes(32).toString('hex');
        const now = new Date();

        await db.insert(proxyServers).values({
            id: proxyId,
            environmentId,
            name,
            description,
            url,
            secret,
            region,
            provider,
            staticIp,
            healthCheckUrl,
            timeoutMs,
            maxConcurrentRequests,
            isActive,
            createdAt: now,
            updatedAt: now,
        });

        // Generate configuration instructions
        const configInstructions = {
            docker: {
                command: `docker run -d -p 3000:3000 -e PROXY_SECRET=${secret} webhook-proxy`,
                env: `PROXY_SECRET=${secret}`
            },
            gcp: {
                env: `PROXY_SECRET=${secret}`,
                command: `gcloud run deploy webhook-proxy --set-env-vars PROXY_SECRET=${secret}`
            },
            aws: {
                env: `PROXY_SECRET=${secret}`,
                command: `aws ecs run-task --overrides '{"containerOverrides":[{"name":"webhook-proxy","environment":[{"name":"PROXY_SECRET","value":"${secret}"}]}]}'`
            }
        };

        return NextResponse.json({
            id: proxyId,
            environmentId,
            name,
            description,
            url,
            region,
            provider,
            staticIp,
            healthCheckUrl,
            timeoutMs,
            maxConcurrentRequests,
            isActive,
            secret, // Only returned on creation
            configInstructions,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        });
    } catch (error) {
        console.error("Error creating proxy server:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
