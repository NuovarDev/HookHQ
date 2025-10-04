import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface PortalTokenPayload {
  endpointGroupId: string;
  environmentId: string;
  allowedEventTypes?: string[];
  applicationName?: string;
  returnUrl?: string;
  iat?: number;
  exp?: number;
}

export type PortalAuthResult = 
  | { success: true; payload: PortalTokenPayload }
  | { success: false; error: string };

/**
 * Verifies a JWT token from the portal
 */
export function verifyPortalToken(token: string): PortalAuthResult {
  console.log("Verifying portal token:", token);
  try {
    const secret = process.env.AUTH_SECRET || "fallback-secret";
    const payload = jwt.verify(token, secret, { 
      issuer: "webhooks-portal" 
    }) as PortalTokenPayload;

    return {
      success: true,
      payload
    };
  } catch (error) {
    console.error("Error verifying portal token:", error);
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          error: "Token has expired"
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          success: false,
          error: "Invalid token"
        };
      }
    }
    return {
      success: false,
      error: "Token verification failed"
    };
  }
}

/**
 * Extracts and verifies JWT token from request
 */
export function authenticatePortalRequest(request: NextRequest): PortalAuthResult {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return {
      success: false,
      error: "No token provided"
    };
  }

  return verifyPortalToken(token);
}

/**
 * Checks if an event type is allowed for the portal user
 */
export function isEventTypeAllowed(
  eventType: string, 
  allowedEventTypes?: string[]
): boolean {
  if (!allowedEventTypes || allowedEventTypes.length === 0) {
    return true; // No restrictions
  }
  
  return allowedEventTypes.includes(eventType);
}

/**
 * Generates a portal URL with token
 */
export function generatePortalUrl(
  baseUrl: string,
  token: string,
  path?: string
): string {
  const portalPath = path ? `/portal${path}` : "/portal";
  return `${baseUrl}${portalPath}?token=${token}`;
}
