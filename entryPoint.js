/* 
 * This file is a wrapper around the OpenNext entry point
 * to inject the queue consumer into the worker.
 */

import * as NextApp from "./.open-next/worker.js";
import Consumer from "./queues/consumer.ts";

export default {
  fetch: NextApp.default.fetch,
  queue: Consumer.queue,
}

export const { DOQueueHandler, DOShardedTagCache, BucketCachePurge } = NextApp;