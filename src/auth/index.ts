import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { apiKey, admin, twoFactor } from "better-auth/plugins";
import { getDb } from "../db";

type AuthBuilderOptions = {
  cf?: Record<string, unknown>;
  env?: CloudflareEnv;
};

function getAuthSecret(env?: CloudflareEnv) {
  return env?.AUTH_SECRET || process.env.AUTH_SECRET;
}

async function authBuilder({ cf, env }: AuthBuilderOptions = {}, useEnv = false) {
  const resolvedEnv = env ?? (await getCloudflareContext({ async: true })).env;
  const dbInstance = useEnv ? await getDb(resolvedEnv) : await getDb();
  const authSecret = getAuthSecret(resolvedEnv);

  return betterAuth(
    withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        cf: cf ?? getCloudflareContext().cf ?? {},
        d1: {
          db: dbInstance as any,
          options: {
            usePlural: true,
          },
        },
        kv: useEnv ? (resolvedEnv.KV as any) : (process.env.KV as any),
      },
      {
        secret: authSecret,
        rateLimit: {
          enabled: true,
        },
        plugins: [
          apiKey({
            enableMetadata: true,
            defaultPrefix: "wh_",
            rateLimit: {
              enabled: false,
            },
          }),
          admin(),
          twoFactor(),
        ],
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: false,
        },
        user: {
          deleteUser: {
            enabled: true,
          },
          additionalFields: {
            lastEnvironment: {
              type: "string",
              required: false,
            },
            role: {
              type: "string",
              required: false,
            },
          },
        },
        advanced: {
          cookiePrefix: "hookhq",
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

export async function createCloudflareAuth(env: CloudflareEnv, request?: Request) {
  return authBuilder(
    {
      env,
      cf: getRequestCf(request),
    },
    true
  );
}

function getRequestCf(request?: Request): Record<string, unknown> {
  if (!request) {
    return {};
  }

  return (request as Request & { cf?: Record<string, unknown> }).cf ?? {};
}
