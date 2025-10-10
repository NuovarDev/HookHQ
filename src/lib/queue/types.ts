import { RetryConfig } from "@/lib/retryUtils";

export interface WebhookMessage {
  id: string;
  endpointId: string;
  eventType: string;
  eventId?: string;
  payload: any | null;
  payloadKey?: string | null;
  timestamp: string;
  idempotencyKey?: string;
  retryConfig: RetryConfig;
  isManualRetry?: boolean;
  originalMessageId?: string;
}