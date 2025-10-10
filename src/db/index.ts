import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "./schema";

export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });

  return drizzle(env.DATABASE, {
    schema,
  });
}

export * from "drizzle-orm";
export * from "@/db/auth.schema";
export * from "@/db/environments.schema";
export * from "@/db/webhooks.schema";
export * from "./schema";