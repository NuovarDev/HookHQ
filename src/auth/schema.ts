import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, admin, twoFactor } from "better-auth/plugins";

// This file exists only for the Better Auth CLI schema generation path.
// Keeping it separate prevents Worker runtime imports from instantiating
// a second Better Auth config that only looks at process.env secrets.
export const auth = betterAuth({
  ...withCloudflare(
    {
      autoDetectIpAddress: true,
      geolocationTracking: true,
      cf: {},
    },
    {
      secret: "schema-generation-secret",
      plugins: [apiKey(), admin(), twoFactor()],
      emailAndPassword: {
        enabled: true,
      },
      user: {
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
    }
  ),
  database: drizzleAdapter({} as D1Database, {
    provider: "sqlite",
    usePlural: true,
  }),
});
