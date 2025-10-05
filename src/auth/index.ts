import { KVNamespace } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, apiKey, admin } from "better-auth/plugins";
import { getDb } from "../db";

// Define an asynchronous function to build your auth configuration
async function authBuilder() {
    const dbInstance = await getDb();
    return betterAuth(
        withCloudflare(
            {
                autoDetectIpAddress: true,
                geolocationTracking: true,
                cf: getCloudflareContext().cf,
                d1: {
                    db: dbInstance as any,
                    options: {
                        usePlural: true,
                    },
                },
                kv: process.env.KV as any,
            },
            {
                rateLimit: {
                    enabled: true,
                },
                plugins: [
                    ...process.env.NEXT_PUBLIC_API_DOCS_ENABLED === 'true' ? [openAPI()] : [],
                    apiKey({
                        enableMetadata: true,
                        defaultPrefix: 'wh_',
                        rateLimit: {
                            enabled: false,
                        },
                    }),
                    admin()],
                emailAndPassword: {
                    enabled: true,
                    requireEmailVerification: false,
                },
                user: {
                    deleteUser: { 
                        enabled: true
                    },
                    additionalFields: {
                        lastEnvironment: {
                            type: "string",
                            required: false,
                        }
                    }
                },
            }
        )
    );
}

// Singleton pattern to ensure a single auth instance
let authInstance: Awaited<ReturnType<typeof authBuilder>> | null = null;

// Asynchronously initializes and retrieves the shared auth instance
export async function initAuth() {
    if (!authInstance) {
        authInstance = await authBuilder();
    }
    return authInstance;
}

/* ======================================================================= */
/* Configuration for Schema Generation                                     */
/* ======================================================================= */

// This simplified configuration is used by the Better Auth CLI for schema generation.
// It includes only the options that affect the database schema.
// It's necessary because the main `authBuilder` performs operations (like `getDb()`)
// which use `getCloudflareContext` (not available in a CLI context only on Cloudflare).
// For more details, see: https://www.answeroverflow.com/m/1362463260636479488
export const auth = betterAuth({
    ...withCloudflare(
        {
            autoDetectIpAddress: true,
            geolocationTracking: true,
            cf: {},
        },
        {
            // Include only configurations that influence the Drizzle schema
            plugins: [openAPI(), apiKey({ enableMetadata: true, defaultPrefix: 'wh_' }), admin()],
            emailAndPassword: {
                enabled: true,
            },
            user: {
                additionalFields: {
                    lastEnvironment: {
                        type: "string",
                        required: false,
                    }
                }
            }
        }
    ),

    // Used by the Better Auth CLI for schema generation.
    database: drizzleAdapter({} as D1Database, {
        provider: "sqlite",
        usePlural: true,
    }),
});
