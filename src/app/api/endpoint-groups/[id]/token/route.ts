import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/db";
import { endpointGroups } from "@/db/webhooks.schema";
import { eq } from "drizzle-orm";
import { authenticateApiRequest } from "@/lib/apiHelpers";

interface PortalTokenPayload {
  endpointGroupId: string;
  environmentId: string;
  allowedEventTypes?: string[];
  applicationName?: string;
  returnUrl?: string;
  iat?: number;
  exp?: number;
}

/**
 * @swagger
 * /endpoint-groups/{id}/token:
 *   post:
 *     summary: Generate Portal Token
 *     x-speakeasy-group: "endpointGroups"
 *     x-speakeasy-name-override: "portal"
 *     description: |
 *       Generate a portal URL/token for end user endpoint management. This generates a temporary link with full access to a specific endpoint group.
 * 
 *       The portal can be themed by passing the `theme` query parameter to the portal URL returned in the response. Passing `theme=dark` or `theme=light` will set the theme and hide the theme toggle button. Passing `theme=default` will allow the user to toggle the theme.
 * 
 *       When embedding the portal in an iframe, the `embed` query parameter can be passed to the portal URL returned in the response. Passing `embed=true` will render a limited version of the portal optimized for embedding.
 * 
 *       API key requires the `endpoints:create`, `endpoints:read`, `endpoints:update`, and `endpoints:delete` permissions to access this endpoint.
 *     tags:
 *       - Endpoint Groups
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Endpoint group ID
 *         schema:
 *           type: string
 *         example: grp_a1b2_efgh5678
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allowedEventTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of event types the user can subscribe to
 *                 example: ["user.created", "user.updated"]
 *               applicationName:
 *                 type: string
 *                 description: Name of the application for the back button
 *                 example: "My Application"
 *               returnUrl:
 *                 type: string
 *                 description: URL to return to when user clicks back button
 *                 example: "https://myapp.com/settings"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 portalUrl: "http://localhost:3000/portal?token=..."
 *                 expiresIn: 86400
 *                 endpointGroup: {
 *                   id: "grp_a1b2_efgh5678",
 *                   name: "My Endpoint Group",
 *                   environmentId: "a12b"
 *                 }
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for portal access
 *                 portalUrl:
 *                   type: string
 *                   description: URL to the portal with token
 *                 expiresIn:
 *                   type: number
 *                   description: Token expiration time in seconds
 *                 endpointGroup:
 *                   type: object
 *                   description: Endpoint group information
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Endpoint group ID
 *                     name:
 *                       type: string
 *                       description: Endpoint group name
 *                     environmentId:
 *                       type: string
 *                       description: Environment ID
 *       400:
 *         description: Bad Request. Usually due to missing parameters, or invalid parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "endpointGroupId is required"
 *       401:
 *         description: Unauthorized. Due to missing or invalid authentication.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Unauthorized"
 *       403:
 *         description: Forbidden. You do not have permission to access this resource or to perform this action.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Forbidden"
 *       404:
 *         description: Not Found. The requested resource was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Endpoint group not found"
 *       429:
 *         description: Too Many Requests. You have exceeded the rate limit. Try again later.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Rate limit exceeded"
 *       500:
 *         description: Internal Server Error. This is a problem with the server that you cannot fix.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/ErrorResponse"
 *             example:
 *               error: "Internal server error"
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateApiRequest(request, { endpoints: ["create", "read", "update", "delete"] });
    
  if (!authResult.success) {
    return authResult.response;
  }
    
  try {
    const { body } = authResult;
    const { id: endpointGroupId } = await params;
    const {
      allowedEventTypes, 
      applicationName, 
      returnUrl 
    } = body as {
      allowedEventTypes?: string[];
      applicationName?: string;
      returnUrl?: string;
    };

    // Verify endpoint group exists
    const db = await getDb();
    const endpointGroup = await db
      .select()
      .from(endpointGroups)
      .where(eq(endpointGroups.id, endpointGroupId))
      .limit(1);

    if (endpointGroup.length === 0) {
      return NextResponse.json({ 
        error: "Endpoint group not found" 
      }, { status: 404 });
    }

    // Create JWT payload
    const payload: PortalTokenPayload = {
      endpointGroupId: endpointGroupId,
      environmentId: endpointGroup[0].environmentId,
      allowedEventTypes,
      applicationName,
      returnUrl,
    };

    // Generate JWT token (expires in 1 hour)
    const secret = process.env.AUTH_SECRET || "fallback-secret";
    const token = jwt.sign(payload, secret, { 
      expiresIn: "24h",
      issuer: "webhooks-portal"
    });

    // Create portal URL with token
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || new URL(request.url).origin;
    const portalUrl = `${baseUrl}/portal?token=${token}`;

    return NextResponse.json({
      token,
      portalUrl,
      expiresIn: 86400, // 24 hours in seconds
      endpointGroup: {
        id: endpointGroup[0].id,
        name: endpointGroup[0].name,
        environmentId: endpointGroup[0].environmentId
      }
    });

  } catch (error) {
    console.error("Error generating portal token:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
