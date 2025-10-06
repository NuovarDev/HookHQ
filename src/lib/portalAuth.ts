import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import type { StringValue } from "ms";

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
  | { 
    success: true;
    payload: PortalTokenPayload;
    portalUrl: string;
    token: string;
    expiresIn?: StringValue | number;
  }
  | { success: false; error: string };

const ISSUER = `${process.env.JWT_PREFIX || "hookhq"}-api`;
const AUDIENCE = `${process.env.JWT_PREFIX || "hookhq"}-portal`;
const EXPIRES_IN = "24h";

/**
 * Generates a JWT token for the portal
 */
export function generatePortalToken(payload: PortalTokenPayload, request: NextRequest, expiresIn?: StringValue | number): PortalAuthResult {
  try {
    if (!process.env.AUTH_SECRET) {
      return {
        success: false,
        error: "AUTH_SECRET is not set"
      };
    }

    const token = jwt.sign(payload, process.env.AUTH_SECRET, { 
      expiresIn: expiresIn || EXPIRES_IN,
      issuer: ISSUER,
      audience: AUDIENCE
    });

    const portalUrl = generatePortalUrl(request, token);

    return {
      success: true,
      payload,
      portalUrl,
      token: token,
      expiresIn: expiresIn || EXPIRES_IN
    };
  } catch (error) {
    console.error("Error generating portal token:", error);
    return {
      success: false,
      error: "Error generating portal token"
    };
  }
}

/**
 * Verifies a JWT token from the portal
 */
export function verifyPortalToken(token: string, request: NextRequest): PortalAuthResult {
  try {
    if (!process.env.AUTH_SECRET) {
      return {
        success: false,
        error: "AUTH_SECRET is not set"
      };
    }

    const secret = process.env.AUTH_SECRET;
    const payload = jwt.verify(token, secret, { 
      issuer: ISSUER,
      audience: AUDIENCE
    }) as PortalTokenPayload;

    const portalUrl = generatePortalUrl(request, token);

    return {
      success: true,
      payload,
      portalUrl,
      token
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

  return verifyPortalToken(token, request);
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
  request: NextRequest,
  token: string,
  path?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || new URL(request.url).origin;
  const portalPath = path ? `/portal${path}` : "/portal";
  return `${baseUrl}${portalPath}?token=${token}`;
}
