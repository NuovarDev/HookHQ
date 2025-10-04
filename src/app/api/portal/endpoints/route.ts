import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { endpoints, eventTypes, endpointGroups } from "@/db/webhooks.schema";
import { eq, and } from "drizzle-orm";
import { authenticatePortalRequest, isEventTypeAllowed } from "@/lib/portalAuth";

export async function GET(request: NextRequest) {
  const authResult = authenticatePortalRequest(request);
  
  if (!authResult.success) {
    return NextResponse.json({ 
      error: authResult.error 
    }, { status: 401 });
  }

  const { payload } = authResult;
  const db = await getDb();

  try {
    // Get endpoints for the endpoint group
    const endpointList = await db
      .select()
      .from(endpoints)
      .where(eq(endpoints.environmentId, payload.environmentId))
      .orderBy(endpoints.createdAt);

    // Filter endpoints that belong to the endpoint group
    const endpointGroup = await db
      .select()
      .from(endpointGroups)
      .where(eq(endpointGroups.id, payload.endpointGroupId))
      .limit(1);

    if (endpointGroup.length === 0) {
      return NextResponse.json({ 
        error: "Endpoint group not found" 
      }, { status: 404 });
    }

    const groupEndpointIds = JSON.parse(endpointGroup[0].endpointIds || "[]");
    const groupEndpoints = endpointList.filter(endpoint => 
      groupEndpointIds.includes(endpoint.id)
    );

    return NextResponse.json({
      endpoints: groupEndpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        description: endpoint.description,
        isActive: endpoint.isActive,
        createdAt: endpoint.createdAt.toISOString(),
        updatedAt: endpoint.updatedAt.toISOString()
      }))
    });

  } catch (error) {
    console.error("Error fetching portal endpoints:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = authenticatePortalRequest(request);
  
  if (!authResult.success) {
    return NextResponse.json({ 
      error: authResult.error 
    }, { status: 401 });
  }

  const { payload } = authResult;
  const body = await request.json();
  const { name, url, description } = body as {
    name: string;
    url: string;
    description?: string;
  };

  if (!name || !url) {
    return NextResponse.json({ 
      error: "Name and URL are required" 
    }, { status: 400 });
  }

  const db = await getDb();

  try {
    // Generate endpoint ID
    const endpointId = `${payload.environmentId}_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date();

    // Create the endpoint
    await db.insert(endpoints).values({
      id: endpointId,
      environmentId: payload.environmentId,
      name,
      url,
      description,
      isActive: true,
      retryPolicy: "exponential",
      maxRetries: 3,
      timeoutMs: 30000,
      headers: null,
      proxyGroupId: null,
      createdAt: now,
      updatedAt: now,
    });

    // Add endpoint to the endpoint group
    const endpointGroup = await db
      .select()
      .from(endpointGroups)
      .where(eq(endpointGroups.id, payload.endpointGroupId))
      .limit(1);

    if (endpointGroup.length > 0) {
      const currentEndpointIds = JSON.parse(endpointGroup[0].endpointIds || "[]");
      const updatedEndpointIds = [...currentEndpointIds, endpointId];

      await db
        .update(endpointGroups)
        .set({
          endpointIds: JSON.stringify(updatedEndpointIds),
          updatedAt: now
        })
        .where(eq(endpointGroups.id, payload.endpointGroupId));
    }

    return NextResponse.json({
      id: endpointId,
      name,
      url,
      description,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

  } catch (error) {
    console.error("Error creating portal endpoint:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
