import { RetryConfig } from "@/lib/retryUtils";

export interface WebhookMessage {
  id: string;
  endpointId: string;
  eventType: string;
  eventId?: string;
  payload: any | null; // Can be null if stored in KV
  payloadKey?: string | null; // KV key for large payloads
  timestamp: string;
  idempotencyKey?: string;
  retryConfig: RetryConfig;
  isManualRetry?: boolean;
  originalMessageId?: string;
}