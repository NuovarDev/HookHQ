import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { endpoints, endpointGroups, webhookAttempts } from "@/db/webhooks.schema";
import { eq, and, inArray, gte, sql } from "drizzle-orm";
import { authenticatePortalRequest } from "@/lib/portalAuth";
import { buildEndpointInsertValues } from "@/lib/publicApi/serializers";
import { resolveDestinationConfig } from "@/lib/destinations/config";

export async function GET(request: NextRequest) {
  const authResult = authenticatePortalRequest(request);

  if (!authResult.success) {
    return NextResponse.json(
      {
        error: authResult.error,
      },
      { status: 401 }
    );
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
      return NextResponse.json(
        {
          error: "Endpoint group not found",
        },
        { status: 404 }
      );
    }

    const groupEndpointIds = JSON.parse(endpointGroup[0].endpointIds || "[]");
    const groupEndpoints = endpointList.filter(endpoint => groupEndpointIds.includes(endpoint.id));

    // Get latest attempt per messageId using SQL window function
    const rankedAttemptsSubquery = db
      .select({
        messageId: webhookAttempts.messageId,
        endpointId: webhookAttempts.endpointId,
        status: webhookAttempts.status,
        attemptNumber: webhookAttempts.attemptNumber,
        attemptedAt: webhookAttempts.attemptedAt,
        rowNumber:
          sql<number>`ROW_NUMBER() OVER (PARTITION BY ${webhookAttempts.messageId} ORDER BY ${webhookAttempts.attemptNumber} DESC, ${webhookAttempts.attemptedAt} DESC)`.as(
            "row_number"
          ),
      })
      .from(webhookAttempts)
      .where(
        and(
          inArray(webhookAttempts.endpointId, groupEndpointIds),
          gte(webhookAttempts.attemptedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
      )
      .as("ranked_attempts");

    const latestAttempts = (await db
      .select({
        messageId: rankedAttemptsSubquery.messageId,
        endpointId: rankedAttemptsSubquery.endpointId,
        status: rankedAttemptsSubquery.status,
        attemptNumber: rankedAttemptsSubquery.attemptNumber,
        attemptedAt: rankedAttemptsSubquery.attemptedAt,
      })
      .from(rankedAttemptsSubquery)
      .where(sql`${rankedAttemptsSubquery.rowNumber} = 1`)) as Array<{
      messageId: string;
      endpointId: string;
      status: string;
      attemptNumber: number;
      attemptedAt: Date;
    }>;

    const formattedEndpoints = await Promise.all(
      groupEndpoints.map(async endpoint => {
        const destination = await resolveDestinationConfig(endpoint);
        const target =
          destination.type === "webhook"
            ? destination.url
            : destination.type === "sqs"
              ? destination.queueUrl
              : destination.topicName;

        return {
          id: endpoint.id,
          name: endpoint.name,
          url: target,
          description: endpoint.description,
          destinationType:
            endpoint.destinationType === "sqs" || endpoint.destinationType === "pubsub"
              ? endpoint.destinationType
              : "webhook",
          isActive: endpoint.isActive,
          createdAt: endpoint.createdAt.toISOString(),
          updatedAt: endpoint.updatedAt.toISOString(),
          topics: endpoint.topics ? JSON.parse(endpoint.topics) : [],
          metrics24h: latestAttempts.filter(
            metric =>
              metric.endpointId === endpoint.id &&
              metric.attemptedAt &&
              metric.attemptedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ),
          metrics7d: latestAttempts.filter(
            metric =>
              metric.endpointId === endpoint.id &&
              metric.attemptedAt &&
              metric.attemptedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ),
        };
      })
    );

    return NextResponse.json({
      endpoints: formattedEndpoints,
    });
  } catch (error) {
    console.error("Error fetching portal endpoints:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = authenticatePortalRequest(request);

  if (!authResult.success) {
    return NextResponse.json(
      {
        error: authResult.error,
      },
      { status: 401 }
    );
  }

  const { payload } = authResult;
  const body = await request.json();
  const {
    name,
    description,
    destinationType = "webhook",
    destination,
  } = body as {
    name: string;
    description?: string;
    destinationType?: "webhook" | "sqs" | "pubsub";
    destination?: Record<string, unknown>;
  };

  if (!name || !destination || typeof destination !== "object") {
    return NextResponse.json(
      {
        error: "Name and destination are required",
      },
      { status: 400 }
    );
  }

  const db = await getDb();

  try {
    // Generate endpoint ID
    const endpointId = `${payload.environmentId}_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date();

    // Create the endpoint
    await db.insert(endpoints).values(
      await buildEndpointInsertValues({
        id: endpointId,
        environmentId: payload.environmentId,
        name,
        description,
        destinationType,
        destination,
        enabled: true,
        now,
      })
    );

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
          updatedAt: now,
        })
        .where(eq(endpointGroups.id, payload.endpointGroupId));
    }

    return NextResponse.json({
      id: endpointId,
      name,
      url:
        destinationType === "sqs"
          ? String(destination.queueUrl ?? "")
          : destinationType === "pubsub"
            ? String(destination.topicName ?? "")
            : String(destination.url ?? ""),
      description,
      destinationType,
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error creating portal endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
