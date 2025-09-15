import { drizzle } from "drizzle-orm/d1";
import { schema } from "../src/db/schema";

export async function getDb(env: CloudflareEnv) {
    return drizzle(env.DATABASE, {
        schema,
    });
}