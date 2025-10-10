import { getDb } from "@/db";
import { endpoints } from "@/db/webhooks.schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiHelpers";

/**
 * @swagger
 * /endpoints:
 *   get:
 *     summary: List Endpoints
 *     description: List endpoints for the current environment
 *     tags:
 *       - Endpoints
 *     parameters:
 *       - name: enabled
 *         in: query
 *         description: Whether to filter endpoints by enabled status
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 endpoints:
 *                   type: array
 *                   description: List of endpoints
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Endpoint ID
 *                       environmentId:
 *                         type: string
 *                         description: Environment ID
 *                       name:
 *                         type: string
 *                         description: Name
 *                       description:
 *                         type: string
 *                         description: Description
 *                       url:
 *                         type: string
 *                         description: URL
 *                       enabled:
 *                         type: boolean
 *                         description: Whether the endpoint is enabled
 *                       retryPolicy:
 *                         type: string
 *                         description: Retry policy
 *                       maxAttempts:
 *                         type: number
 *                         description: Maximum number of attempts
 *                       timeoutMs:
 *                         type: number
 *                         description: Timeout
 *                       customHeaders:
 *                         type: object
 *                         description: Custom headers
 *                       proxyGroupId:
 *                         type: string
 *                         description: Proxy group ID
 *                       createdAt:
 *                         type: string
 *                         description: Created at
 *                       updatedAt:
 *                         type: string
 *                         description: Updated at
 *               example:
 *                 endpoints:
 *                   - id: ep_a1b2_abcd1234
 *                     environmentId: a1b2
 *                     name: My Webhook Endpoint
 *                     description: My Webhook Endpoint description
 *                     url: https://example.com/webhook
 *                     enabled: true
 *                     retryPolicy: exponential
 *                     maxAttempts: 3
 *                     timeoutMs: 30000
 *                     customHeaders: {}
 *                     proxyGroupId: proxygrp_a1b2_efgh5678
 *                     createdAt: 2021-01-01T00:00:00.000Z
 *                     updatedAt: 2021-01-01T00:00:00.000Z
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Forbidden"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Internal server error"
 *     x-speakeasy-name-override: "list"
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiRequest(request, { endpoints: ["read"] });

  if (!authResult.success) {
    return authResult.response;
  }

  const { environmentId } = authResult;

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const enabled = searchParams.get("enabled");

  // Build query conditions
  const conditions = [eq(endpoints.environmentId, environmentId)];

  // Add enabled filter if provided
  if (enabled !== null) {
    conditions.push(eq(endpoints.isActive, enabled === "true"));
  }

  // Execute query
  const db = await getDb();
  const endpointList = await db
    .select()
    .from(endpoints)
    .where(and(...conditions))
    .orderBy(endpoints.createdAt);

  // Format the response
  const formattedEndpoints = endpointList.map(endpoint => ({
    id: endpoint.id,
    environmentId: endpoint.environmentId,
    name: endpoint.name,
    description: endpoint.description,
    url: endpoint.url,
    enabled: endpoint.isActive,
    retryPolicy: endpoint.retryPolicy,
    maxAttempts: endpoint.maxRetries,
    timeoutMs: endpoint.timeoutMs,
    customHeaders: endpoint.headers ? JSON.parse(endpoint.headers) : {},
    proxyGroupId: endpoint.proxyGroupId,
    createdAt: endpoint.createdAt.toISOString(),
    updatedAt: endpoint.updatedAt.toISOString()
  }));

  return NextResponse.json({ endpoints: formattedEndpoints });
}

/**
 * @swagger
 * /endpoints:
 *   post:
 *     summary: Create Endpoint
 *     description: Create new endpoint
 *     tags:
 *       - Endpoints
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["name", "url"]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the endpoint
 *                 example: My Webhook Endpoint
 *               description:
 *                 type: string
 *                 description: Description of the endpoint
 *                 example: My Webhook Endpoint description
 *               url:
 *                 type: string
 *                 description: URL of the endpoint
 *                 example: https://example.com/webhook
 *               enabled:
 *                 type: boolean
 *                 description: Whether the endpoint is enabled
 *                 default: true
 *               retryPolicy:
 *                 type: string
 *                 description: Retry policy of the endpoint
 *                 default: exponential
 *                 enum: [exponential, linear, fixed]
 *               maxAttempts:
 *                 type: number
 *                 description: Maximum number of attempts of the endpoint
 *                 default: 3
 *               timeoutMs:
 *                 type: number
 *                 description: Timeout of the endpoint
 *                 default: 30000
 *               customHeaders:
 *                 type: object
 *                 description: Custom headers of the endpoint
 *                 example:
 *                   "Content-Type": "application/json"
 *               proxyGroupId:
 *                 type: string
 *                 description: Proxy group ID of the endpoint
 *                 example: proxygrp_a1b2_efgh5678
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Endpoint ID
 *                 environmentId:
 *                   type: string
 *                   description: Environment ID
 *                 name:
 *                   type: string
 *                   description: Name
 *                 description:
 *                   type: string
 *                   description: Description
 *                 url:
 *                   type: string
 *                   description: URL
 *                 enabled:
 *                   type: boolean
 *                   description: Whether the endpoint is enabled
 *                 retryPolicy:
 *                   type: string
 *                   description: Retry policy
 *                 maxAttempts:
 *                   type: number
 *                   description: Maximum number of attempts
 *                 timeoutMs:
 *                   type: number
 *                   description: Timeout
 *                 customHeaders:
 *                   type: object
 *                   description: Custom headers
 *                 proxyGroupId:
 *                   type: string
 *                   description: Proxy group ID
 *                 createdAt:
 *                   type: string
 *                   description: Created at
 *                 updatedAt:
 *                   type: string
 *                   description: Updated at
 *               example:
 *                 id: ep_a1b2_abcd1234
 *                 environmentId: a1b2
 *                 name: My Webhook Endpoint
 *                 description: My Webhook Endpoint description
 *                 url: https://example.com/webhook
 *                 enabled: true
 *                 retryPolicy: exponential
 *                 maxAttempts: 3
 *                 timeoutMs: 30000
 *                 customHeaders: {}
 *                 proxyGroupId: proxygrp_a1b2_efgh5678
 *                 createdAt: 2021-01-01T00:00:00.000Z
 *                 updatedAt: 2021-01-01T00:00:00.000Z
 *                 error: "Endpoint created"
 * 
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Name and URL are required"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Forbidden"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *               example:
 *                 error: "Internal server error"
 *     x-speakeasy-name-override: "create"
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiRequest(request, { endpoints: ["create"] });

  if (!authResult.success) {
    return authResult.response;
  }

  const { environmentId, body } = authResult;

  const {
    name,
    description,
    url,
    enabled = true,
    retryPolicy = "exponential",
    maxAttempts = 3,
    timeoutMs = 10000,
    customHeaders = {},
    proxyGroupId
  } = body as {
    name: string;
    description?: string;
    url: string;
    enabled?: boolean;
    retryPolicy?: string;
    maxAttempts?: number;
    timeoutMs?: number;
    customHeaders?: Record<string, string>;
    proxyGroupId?: string;
  };

  if (!name || !url) {
    return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  }

  // Generate endpoint ID with prefix (ep_{environmentId}_{random})
  const endpointId = `ep_${environmentId}_${crypto.randomUUID().substring(0, 8)}`;
  const now = new Date();

  const db = await getDb();
  await db.insert(endpoints).values({
    id: endpointId,
    environmentId,
    name,
    description,
    url,
    isActive: enabled,
    retryPolicy,
    maxRetries: maxAttempts,
    timeoutMs,
    headers: JSON.stringify(customHeaders),
    proxyGroupId,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    id: endpointId,
    environmentId,
    name,
    description,
    url,
    enabled,
    retryPolicy,
    maxAttempts,
    timeoutMs,
    customHeaders,
    proxyGroupId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}
