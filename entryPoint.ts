// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as Next } from "./.open-next/worker.js";
import { default as Consumer } from "./queues/consumer.js";
import { default as Api } from "@/lib/publicApi";

export default {
  async fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname;

    if (pathname.startsWith("/api/v1")) {
      return Api.fetch(request, env, ctx);
    }

    return Next.fetch(request, env, ctx);
  },
  queue: Consumer.queue,
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore `.open-next/worker.js` is generated at build time
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
