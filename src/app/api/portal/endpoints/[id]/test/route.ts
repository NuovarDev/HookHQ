import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { endpointGroups, endpoints, eventTypes } from "@/db/webhooks.schema";
import { authenticatePortalRequest } from "@/lib/portalAuth";
import { handleSendEventRequest } from "@/lib/publicApi/send";
import { parseEventSubscriptions } from "@/lib/subscriptions";

type JsonSchema = {
  type?: string;
  example?: unknown;
  default?: unknown;
  enum?: unknown[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
};

function exampleFromSchema(schema: JsonSchema | null | undefined): unknown {
  if (!schema) return { test: true };
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === "array") return [exampleFromSchema(schema.items)];
  if (schema.type === "object" || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [key, exampleFromSchema(value)])
    );
  }
  if (schema.type === "string") return "test";
  if (schema.type === "integer" || schema.type === "number") return 1;
  if (schema.type === "boolean") return true;
  return { test: true };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = authenticatePortalRequest(request);
  if (!authResult.success) return NextResponse.json({ error: authResult.error }, { status: 401 });

  const { id: endpointId } = await params;
  const db = await getDb();

  try {
    const [endpoint] = await db
      .select()
      .from(endpoints)
      .where(and(eq(endpoints.id, endpointId), eq(endpoints.environmentId, authResult.payload.environmentId)))
      .limit(1);
    const [group] = await db
      .select()
      .from(endpointGroups)
      .where(eq(endpointGroups.id, authResult.payload.endpointGroupId))
      .limit(1);
    if (!endpoint || !group || !JSON.parse(group.endpointIds || "[]").includes(endpointId)) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    const availableTypes = await db
      .select()
      .from(eventTypes)
      .where(eq(eventTypes.environmentId, endpoint.environmentId));
    const endpointTypes = parseEventSubscriptions(endpoint.topics);
    const groupTypes = parseEventSubscriptions(group.eventTypes);
    const eventType = availableTypes.find(
      type =>
        (endpointTypes.includes("*") || endpointTypes.includes(type.name)) &&
        (groupTypes.includes("*") || groupTypes.includes(type.name))
    );
    const variables = Object.fromEntries(
      (eventType?.variables ? JSON.parse(eventType.variables) : []).map(
        (variable: { name: string; example: string }) => [variable.name, variable.example]
      )
    );
    const payload = eventType?.examplePayload
      ? JSON.parse(eventType.examplePayload)
      : exampleFromSchema(eventType?.schema ? (JSON.parse(eventType.schema) as JsonSchema) : undefined);
    const { env } = await getCloudflareContext({ async: true });
    const response = await handleSendEventRequest({
      body: {
        destinations: [endpointId],
        eventType: eventType?.name,
        eventId: `portal-test-${crypto.randomUUID()}`,
        payload,
        variables,
        logPayload: true,
      },
      env,
      request,
      environmentId: endpoint.environmentId,
      // The portal has already verified this endpoint belongs to its scoped
      // group. Keep the test to one endpoint while applying normal proxy
      // precedence: endpoint configuration, then its portal group.
      internalDeliveryTargets: [{ endpointId, proxyGroupId: group.proxyGroupId ?? null }],
      // Portal tests must be direct when neither the endpoint nor its group
      // configures a proxy; the environment default is not part of this flow.
      useDefaultProxyGroup: false,
    });
    const responseBody = await response.json();
    return NextResponse.json(responseBody, { status: response.status });
  } catch (error) {
    console.error("Error sending portal test event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send test event" },
      { status: 500 }
    );
  }
}
