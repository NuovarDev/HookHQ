import { WebhookConsumer } from "@/lib/queue/WebhookConsumer";

export default {
  async queue(
    batch: MessageBatch,
    env: CloudflareEnv,
  ): Promise<void> {
    const consumer = new WebhookConsumer(env);
    await consumer.processBatch(batch);
  },
};