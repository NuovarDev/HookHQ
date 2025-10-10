// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as Next } from "./.open-next/worker.js";
import { default as Consumer } from "./queues/consumer.js";

export default {
  fetch: Next.fetch,
  queue: Consumer.queue,
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore `.open-next/worker.js` is generated at build time
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
