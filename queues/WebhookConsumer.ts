import { getDb } from "./db";
import { webhookMessages } from "../src/db/webhooks.schema";
import { eq } from "drizzle-orm";
import { WebhookDelivery } from "@/lib/WebhookDelivery";
import { shouldRetry, calculateRetryDelay } from "@/lib/retryUtils";
import { WebhookMessage } from "./types";

export class WebhookConsumer {
  private env: CloudflareEnv;

  constructor(env: CloudflareEnv) {
    this.env = env;
  }

  /**
   * Update webhook message status in the database
   */
  private async updateWebhookStatus(
    webhookId: string,
    status: "delivered" | "retrying" | "failed",
    attempts: number,
    error?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      attempts
    };

    switch (status) {
      case "delivered":
        updateData.deliveredAt = new Date();
        break;
      case "retrying":
        updateData.lastError = error || 'Unknown error';
        updateData.lastErrorAt = new Date();
        break;
      case "failed":
        updateData.failedAt = new Date();
        updateData.lastError = error || 'Unknown error';
        updateData.lastErrorAt = new Date();
        break;
    }

    const db = await getDb(this.env);

    await db
      .update(webhookMessages)
      .set(updateData)
      .where(eq(webhookMessages.id, webhookId));
  }

  /**
   * Handle successful webhook delivery
   */
  private async handleSuccess(
    message: Message,
    webhookData: WebhookMessage
  ): Promise<void> {
    message.ack();
    await this.updateWebhookStatus(webhookData.id, "delivered", message.attempts);
    console.log(`Webhook ${webhookData.id} delivered successfully for ${webhookData.endpointId}`);
  }

  /**
   * Handle webhook retry
   */
  private async handleRetry(
    message: Message,
    webhookData: WebhookMessage,
    error: string
  ): Promise<void> {
    const delaySeconds = calculateRetryDelay(message.attempts, webhookData.retryConfig);
    
    message.retry({
      delaySeconds: delaySeconds,
    });

    await this.updateWebhookStatus(webhookData.id, "retrying", message.attempts, error);
    console.log(`Webhook ${webhookData.id} failed for ${webhookData.endpointId}, retrying in ${delaySeconds}s (attempt ${message.attempts})`);
  }

  /**
   * Handle permanent webhook failure
   */
  private async handleFailure(
    message: Message,
    webhookData: WebhookMessage,
    error: string
  ): Promise<void> {
    message.ack();
    await this.updateWebhookStatus(webhookData.id, "failed", message.attempts, error);
    
    // Store failed message in KV for manual retry capability
    await this.storeFailedMessage(webhookData, error, message.attempts);
    
    console.log(`Webhook ${webhookData.id} failed permanently for ${webhookData.endpointId} after ${message.attempts} attempts`);
  }

  /**
   * Store failed message in KV for manual retry capability
   */
  private async storeFailedMessage(
    webhookData: WebhookMessage,
    error: string,
    attempts: number
  ): Promise<void> {
    try {
      const failedMessageKey = `failed:${webhookData.id}:${webhookData.endpointId}`;
      
      // Get the actual payload (either inline or from KV)
      let actualPayload = webhookData.payload;
      if (webhookData.payloadKey && !actualPayload) {
        try {
          const payloadData = await this.env.KV.get(webhookData.payloadKey);
          if (payloadData) {
            actualPayload = JSON.parse(payloadData);
          }
        } catch (payloadError) {
          console.error('Error fetching payload from KV for failed message:', payloadError);
          // Continue with null payload rather than failing
        }
      }
      
      const failedMessageData = {
        webhookData: {
          ...webhookData,
          payload: actualPayload, // Store the actual payload, not the key
          payloadKey: null // Clear the payloadKey since we're storing the payload directly
        },
        error,
        attempts,
        failedAt: new Date().toISOString(),
        retryable: true
      };

      await this.env.KV.put(failedMessageKey, JSON.stringify(failedMessageData), {
        expirationTtl: 60 * 60 * 24 * 30 // 30 days
      });

      console.log(`Stored failed message ${webhookData.id} in KV for manual retry`);
    } catch (error) {
      console.error('Error storing failed message in KV:', error);
      // Don't throw - this shouldn't break the main flow
    }
  }

  /**
   * Process a single webhook message
   */
  private async processMessage(message: Message): Promise<void> {
    const webhookData = message.body as WebhookMessage;
    console.log('Processing webhook:', webhookData.id, 'for endpoint:', webhookData.endpointId, 'attempt:', message.attempts);

    const delivery = new WebhookDelivery(webhookData, this.env);
    delivery.setAttempts(message.attempts);

    try {
      // Process the single endpoint
      const result = await delivery.send(webhookData.endpointId);

      // Determine if we should retry based on retry configuration
      const shouldRetryMessage = shouldRetry(result.success, message.attempts, webhookData.retryConfig);

      if (result.success) {
        await this.handleSuccess(message, webhookData);
      } else if (shouldRetryMessage) {
        await this.handleRetry(message, webhookData, result.error || 'Unknown error');
      } else {
        await this.handleFailure(message, webhookData, result.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Error processing webhook message:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const shouldRetryMessage = shouldRetry(false, message.attempts, webhookData.retryConfig);
      
      if (shouldRetryMessage) {
        await this.handleRetry(message, webhookData, errorMessage);
      } else {
        await this.handleFailure(message, webhookData, errorMessage);
      }
    }
  }

  /**
   * Process a batch of webhook messages
   */
  async processBatch(batch: MessageBatch): Promise<void> {
    for (const message of batch.messages) {
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error('Error processing message in batch:', error);
        // Continue processing other messages in the batch
      }
    }
  }
}
