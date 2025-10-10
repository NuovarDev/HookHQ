import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { environments } from "@/db/environments.schema";
import { generateEnvironmentId } from "@/lib/environments";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/environments - List all shared environments
export async function GET() {
  try {
    const authInstance = await initAuth();
    const session = await authInstance.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const allEnvironments = await db
      .select()
      .from(environments)
      .orderBy(environments.createdAt);

    const formattedEnvironments = allEnvironments.map(env => ({
      id: env.id,
      name: env.name,
      description: env.description,
      isDefault: env.isDefault,
      createdAt: env.createdAt.toISOString(),
    }));

    return NextResponse.json({ environments: formattedEnvironments });
  } catch (error) {
    console.error("Error fetching environments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/environments - Create new shared environment
export async function POST(request: NextRequest) {
  try {
    const authInstance = await initAuth();
    const session = await authInstance.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body as { name: string; description?: string };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Environment name is required" }, { status: 400 });
    }

    const db = await getDb();
    const environmentId = generateEnvironmentId();
    const now = new Date();

    await db.insert(environments).values({
      id: environmentId,
      name: name.trim(),
      description: description?.trim() || null,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id: environmentId,
      name: name.trim(),
      description: description?.trim(),
      isDefault: false,
      createdAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error creating environment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
