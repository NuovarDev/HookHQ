import { endpointGroups, endpoints } from "@/db/webhooks.schema";
import {
  parseAutoDisableConfig,
  parseFailureAlertConfig,
  resolveDestinationConfig,
  resolveRetryConfig,
  serializeAutoDisableConfig,
  serializeDestinationConfig,
  serializeFailureAlertConfig,
} from "@/lib/destinations/config";
import { parseEventSubscriptions, serializeEventSubscriptions } from "@/lib/subscriptions";
import type { AutoDisableConfig, DestinationConfig, FailureAlertConfig, RetryConfig } from "@/lib/destinations/types";

function normalizeDestinationInput(
  destinationType: "webhook" | "sqs" | "pubsub" | undefined,
  destination: Record<string, unknown> | DestinationConfig
): DestinationConfig {
  const rawDestination = destination as Record<string, unknown>;

  if (destinationType === "sqs") {
    return {
      type: "sqs",
      queueUrl: String(rawDestination.queueUrl ?? ""),
      region: String(rawDestination.region ?? ""),
      accessKeyId: String(rawDestination.accessKeyId ?? ""),
      secretAccessKey: String(rawDestination.secretAccessKey ?? ""),
      delaySeconds: rawDestination.delaySeconds != null ? Number(rawDestination.delaySeconds) : undefined,
      messageGroupId: rawDestination.messageGroupId ? String(rawDestination.messageGroupId) : undefined,
      messageDeduplicationId: rawDestination.messageDeduplicationId
        ? String(rawDestination.messageDeduplicationId)
        : undefined,
    };
  }

  if (destinationType === "pubsub") {
    return {
      type: "pubsub",
      topicName: String(rawDestination.topicName ?? ""),
      serviceAccountJson: String(rawDestination.serviceAccountJson ?? ""),
      attributes: (rawDestination.attributes as Record<string, string> | undefined) ?? {},
      orderingKey: rawDestination.orderingKey ? String(rawDestination.orderingKey) : undefined,
    };
  }

  return {
    type: "webhook",
    url: String(rawDestination.url ?? ""),
    timeoutMs: rawDestination.timeoutMs != null ? Number(rawDestination.timeoutMs) : 30000,
    customHeaders: (rawDestination.customHeaders as Record<string, string> | undefined) ?? {},
    proxyGroupId: (rawDestination.proxyGroupId as string | null | undefined) ?? null,
  };
}

export function formatEndpoint(endpoint: typeof endpoints.$inferSelect) {
  return {
    id: endpoint.id,
    environmentId: endpoint.environmentId,
    name: endpoint.name,
    description: endpoint.description,
    eventTypes: parseEventSubscriptions(endpoint.topics),
    destinationType:
      endpoint.destinationType === "sqs" || endpoint.destinationType === "pubsub"
        ? endpoint.destinationType
        : "webhook",
    destination: resolveDestinationConfig(endpoint),
    enabled: endpoint.isActive,
    retry: resolveRetryConfig(endpoint),
    autoDisable: parseAutoDisableConfig(endpoint.autoDisableConfig),
    createdAt: endpoint.createdAt.toISOString(),
    updatedAt: endpoint.updatedAt.toISOString(),
  };
}

export function formatEndpointGroup(group: typeof endpointGroups.$inferSelect) {
  return {
    id: group.id,
    environmentId: group.environmentId,
    name: group.name,
    description: group.description,
    endpointIds: group.endpointIds ? JSON.parse(group.endpointIds) : [],
    eventTypes: parseEventSubscriptions(group.eventTypes),
    enabled: group.isActive,
    failureAlerts: parseFailureAlertConfig(group.failureAlertConfig),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export function buildEndpointInsertValues(input: {
  environmentId: string;
  name: string;
  description?: string;
  eventTypes?: string[];
  enabled?: boolean;
  destinationType?: "webhook" | "sqs" | "pubsub";
  destination: Record<string, unknown> | DestinationConfig;
  retry?: Partial<RetryConfig>;
  autoDisable?: Partial<AutoDisableConfig>;
  id?: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const retry = input.retry;
  const destination = normalizeDestinationInput(input.destinationType, input.destination);
  const autoDisableConfig =
    input.autoDisable !== undefined
      ? serializeAutoDisableConfig({
          enabled: input.autoDisable.enabled ?? false,
          threshold: input.autoDisable.threshold ?? 10,
        })
      : "{}";

  return {
    id: input.id ?? crypto.randomUUID(),
    environmentId: input.environmentId,
    name: input.name,
    description: input.description,
    topics: serializeEventSubscriptions(input.eventTypes),
    url:
      destination.type === "webhook"
        ? destination.url
        : destination.type === "sqs"
          ? destination.queueUrl
          : destination.topicName,
    isActive: input.enabled ?? true,
    retryPolicy: retry?.strategy ?? "exponential",
    backoffStrategy: retry?.strategy ?? "exponential",
    retryStrategy: retry?.strategy ?? "exponential",
    baseDelaySeconds: retry?.baseDelaySeconds ?? 5,
    maxRetryDelaySeconds: retry?.maxDelaySeconds ?? 300,
    retryJitterFactor: retry?.jitterFactor ?? 0.2,
    maxRetries: retry?.maxAttempts ?? 3,
    autoDisableConfig,
    timeoutMs: destination.type === "webhook" ? destination.timeoutMs : 30000,
    headers: destination.type === "webhook" ? JSON.stringify(destination.customHeaders ?? {}) : null,
    proxyGroupId: destination.type === "webhook" ? (destination.proxyGroupId ?? null) : null,
    destinationType: input.destinationType ?? destination.type,
    destinationConfig: serializeDestinationConfig(destination),
    createdAt: now,
    updatedAt: now,
  };
}

export function buildEndpointUpdateValues(input: {
  name?: string;
  description?: string;
  eventTypes?: string[];
  enabled?: boolean;
  destinationType?: "webhook" | "sqs" | "pubsub";
  destination?: Record<string, unknown> | DestinationConfig;
  retry?: Partial<RetryConfig>;
  autoDisable?: Partial<AutoDisableConfig>;
  existingAutoDisable?: AutoDisableConfig;
}) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.eventTypes !== undefined) updateData.topics = serializeEventSubscriptions(input.eventTypes);
  if (input.enabled !== undefined) updateData.isActive = input.enabled;

  if (input.destinationType !== undefined) {
    updateData.destinationType = input.destinationType;
  }

  if (input.destination) {
    const destination = normalizeDestinationInput(input.destinationType, input.destination);
    updateData.url =
      destination.type === "webhook"
        ? destination.url
        : destination.type === "sqs"
          ? destination.queueUrl
          : destination.topicName;
    updateData.timeoutMs = destination.type === "webhook" ? destination.timeoutMs : 30000;
    updateData.headers = destination.type === "webhook" ? JSON.stringify(destination.customHeaders ?? {}) : null;
    updateData.proxyGroupId = destination.type === "webhook" ? (destination.proxyGroupId ?? null) : null;
    updateData.destinationConfig = serializeDestinationConfig(destination);
    updateData.destinationType = destination.type;
  }

  if (input.retry) {
    if (input.retry.strategy !== undefined) {
      updateData.retryPolicy = input.retry.strategy;
      updateData.backoffStrategy = input.retry.strategy;
      updateData.retryStrategy = input.retry.strategy;
    }
    if (input.retry.maxAttempts !== undefined) updateData.maxRetries = input.retry.maxAttempts;
    if (input.retry.baseDelaySeconds !== undefined) updateData.baseDelaySeconds = input.retry.baseDelaySeconds;
    if (input.retry.maxDelaySeconds !== undefined) updateData.maxRetryDelaySeconds = input.retry.maxDelaySeconds;
    if (input.retry.jitterFactor !== undefined) updateData.retryJitterFactor = input.retry.jitterFactor;
  }

  if (input.autoDisable !== undefined) {
    updateData.autoDisableConfig = serializeAutoDisableConfig({
      enabled: input.autoDisable.enabled ?? input.existingAutoDisable?.enabled ?? false,
      threshold: input.autoDisable.threshold ?? input.existingAutoDisable?.threshold ?? 10,
    });
  }

  return updateData;
}

export function buildEndpointGroupInsertValues(input: {
  id?: string;
  environmentId: string;
  name: string;
  description?: string;
  endpointIds?: string[];
  eventTypes?: string[];
  enabled?: boolean;
  failureAlerts?: Partial<FailureAlertConfig>;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    id: input.id ?? crypto.randomUUID(),
    environmentId: input.environmentId,
    name: input.name,
    description: input.description,
    endpointIds: JSON.stringify(input.endpointIds ?? []),
    eventTypes: serializeEventSubscriptions(input.eventTypes),
    isActive: input.enabled ?? true,
    failureAlertConfig: serializeFailureAlertConfig({
      enabled: input.failureAlerts?.enabled ?? false,
      threshold: input.failureAlerts?.threshold ?? 5,
      windowMinutes: input.failureAlerts?.windowMinutes ?? 60,
      endpointIds: input.failureAlerts?.endpointIds ?? [],
      channelType: input.failureAlerts?.channelType ?? "webhook",
      destinationUrl: input.failureAlerts?.destinationUrl ?? "",
    }),
    createdAt: now,
    updatedAt: now,
  };
}

export function buildEndpointGroupUpdateValues(input: {
  name?: string;
  description?: string;
  endpointIds?: string[];
  eventTypes?: string[];
  enabled?: boolean;
  failureAlerts?: Partial<FailureAlertConfig>;
  existingFailureAlerts: FailureAlertConfig;
}) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.endpointIds !== undefined) updateData.endpointIds = JSON.stringify(input.endpointIds);
  if (input.eventTypes !== undefined) updateData.eventTypes = serializeEventSubscriptions(input.eventTypes);
  if (input.enabled !== undefined) updateData.isActive = input.enabled;
  if (input.failureAlerts !== undefined) {
    updateData.failureAlertConfig = serializeFailureAlertConfig({
      ...input.existingFailureAlerts,
      ...input.failureAlerts,
      endpointIds: input.failureAlerts.endpointIds ?? input.existingFailureAlerts.endpointIds,
    });
  }
  return updateData;
}
