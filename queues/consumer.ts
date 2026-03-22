import { DestinationConsumer } from "@/lib/queue/DestinationConsumer";

export default {
  async queue(batch: MessageBatch, env: CloudflareEnv): Promise<void> {
    const consumer = new DestinationConsumer(env);
    await consumer.processBatch(batch);
  },
};
