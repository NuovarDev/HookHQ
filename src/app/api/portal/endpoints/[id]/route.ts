import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { endpoints, endpointGroups } from "@/db/webhooks.schema";
import { eq } from "drizzle-orm";
import { authenticatePortalRequest } from "@/lib/portalAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticatePortalRequest(request);
  
  if (!authResult.success) {
    return NextResponse.json({ 
      error: authResult.error 
    }, { status: 401 });
  }

  const { payload } = authResult;
  const endpointId = params.id;

  if (!endpointId) {
    return NextResponse.json({ 
      error: "Endpoint ID is required" 
    }, { status: 400 });
  }

  const db = await getDb();

  try {
    // Check if endpoint exists and belongs to the environment
    const endpoint = await db
      .select()
      .from(endpoints)
      .where(eq(endpoints.id, endpointId))
      .limit(1);

    if (endpoint.length === 0) {
      return NextResponse.json({ 
        error: "Endpoint not found" 
      }, { status: 404 });
    }

    if (endpoint[0].environmentId !== payload.environmentId) {
      return NextResponse.json({ 
        error: "Endpoint not found" 
      }, { status: 404 });
    }

    // Get the endpoint group to verify the endpoint belongs to it
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
    if (!groupEndpointIds.includes(endpointId)) {
      return NextResponse.json({ 
        error: "Endpoint not found in group" 
      }, { status: 404 });
    }

    // Remove endpoint from the group
    const updatedEndpointIds = groupEndpointIds.filter((id: string) => id !== endpointId);
    
    await db
      .update(endpointGroups)
      .set({
        endpointIds: JSON.stringify(updatedEndpointIds),
        updatedAt: new Date()
      })
      .where(eq(endpointGroups.id, payload.endpointGroupId));

    // Delete the endpoint
    await db
      .delete(endpoints)
      .where(eq(endpoints.id, endpointId));

    return NextResponse.json({ 
      message: "Endpoint deleted successfully",
      deletedEndpoint: {
        id: endpoint[0].id,
        name: endpoint[0].name
      }
    });

  } catch (error) {
    console.error("Error deleting portal endpoint:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
