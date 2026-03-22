import { z } from "@hono/zod-openapi";

export const authHeaderSchema = z.object({
  authorization: z.string().openapi({
    description: "Bearer API key",
    example: "Bearer wh_1234567890abcdef",
  }),
});

export const optionalAuthHeaderSchema = z.object({
  authorization: z.string().optional().openapi({
    description: "Bearer API key. Optional when using a session cookie.",
    example: "Bearer wh_1234567890abcdef",
  }),
});

export const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
    details: z.array(z.string()).optional(),
  })
  .openapi("PublicApiError");

export const genericObjectSchema = z.record(z.string(), z.any()).openapi("GenericObject");

export const idParamSchema = z.object({
  id: z.string(),
});

export const environmentSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    isDefault: z.boolean(),
    createdAt: z.string(),
  })
  .openapi("Environment");

export const createEnvironmentSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
  })
  .openapi("CreateEnvironmentRequest");

export const messageRetryParamSchema = z.object({
  messageId: z.string(),
  endpointId: z.string(),
});

export const enabledQuerySchema = z.object({
  enabled: z.enum(["true", "false"]).optional(),
});

export const eventSubscriptionSchema = z
  .array(z.string().min(1))
  .min(1)
  .openapi({
    description:
      'Event type subscriptions. Use ["*"] to subscribe to all events, including events sent without a type.',
    example: ["*"],
  });

export const destinationTypeSchema = z.enum(["webhook", "sqs"]);
export const retryStrategySchema = z.enum(["none", "fixed", "linear", "exponential"]);
export const alertChannelTypeSchema = z.enum(["webhook", "slack"]);

export const retryConfigSchema = z
  .object({
    strategy: retryStrategySchema,
    maxAttempts: z.number().int().min(1),
    baseDelaySeconds: z.number().int().min(1),
    maxDelaySeconds: z.number().int().min(1),
    jitterFactor: z.number().min(0).max(1),
  })
  .openapi("RetryConfig");

const webhookDestinationConfigSchema = z.object({
  url: z.string().url(),
  timeoutMs: z.number().int().min(1000).optional(),
  customHeaders: z.record(z.string(), z.string()).optional(),
  proxyGroupId: z.string().nullable().optional(),
});

const sqsDestinationConfigSchema = z.object({
  queueUrl: z.string().url(),
  region: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  delaySeconds: z.number().int().min(0).max(900).optional(),
  messageGroupId: z.string().optional(),
  messageDeduplicationId: z.string().optional(),
});

export const failureAlertConfigSchema = z
  .object({
    enabled: z.boolean(),
    threshold: z.number().int().min(1),
    windowMinutes: z.number().int().min(1),
    endpointIds: z.array(z.string()),
    channelType: alertChannelTypeSchema,
    destinationUrl: z.string().optional(),
  })
  .openapi("FailureAlertConfig");

export const autoDisableConfigSchema = z
  .object({
    enabled: z.boolean(),
    threshold: z.number().int().min(1).openapi({
      description: "Disable the destination after this many consecutive permanent delivery failures.",
    }),
  })
  .openapi("AutoDisableConfig");

export const endpointSchema = z
  .object({
    id: z.string(),
    environmentId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    eventTypes: eventSubscriptionSchema,
    destinationType: destinationTypeSchema,
    destination: z.union([webhookDestinationConfigSchema, sqsDestinationConfigSchema]),
    enabled: z.boolean(),
    retry: retryConfigSchema,
    autoDisable: autoDisableConfigSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Endpoint");

export const endpointCreateSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    eventTypes: eventSubscriptionSchema.optional(),
    destinationType: destinationTypeSchema.default("webhook"),
    destination: z.union([webhookDestinationConfigSchema, sqsDestinationConfigSchema]),
    enabled: z.boolean().optional(),
    retry: retryConfigSchema.partial().optional(),
    autoDisable: autoDisableConfigSchema.partial().optional(),
  })
  .openapi("CreateEndpointRequest");

export const endpointUpdateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    eventTypes: eventSubscriptionSchema.optional(),
    destinationType: destinationTypeSchema.optional(),
    destination: z.union([webhookDestinationConfigSchema, sqsDestinationConfigSchema]).optional(),
    enabled: z.boolean().optional(),
    retry: retryConfigSchema.partial().optional(),
    autoDisable: autoDisableConfigSchema.partial().optional(),
  })
  .openapi("UpdateEndpointRequest");

export const endpointGroupSchema = z
  .object({
    id: z.string(),
    environmentId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    endpointIds: z.array(z.string()),
    eventTypes: eventSubscriptionSchema,
    enabled: z.boolean(),
    failureAlerts: failureAlertConfigSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("EndpointGroup");

export const endpointGroupCreateSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    endpointIds: z.array(z.string()).optional(),
    eventTypes: eventSubscriptionSchema.optional(),
    enabled: z.boolean().optional(),
    failureAlerts: failureAlertConfigSchema.partial().optional(),
  })
  .openapi("CreateEndpointGroupRequest");

export const endpointGroupUpdateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    endpointIds: z.array(z.string()).optional(),
    eventTypes: eventSubscriptionSchema.optional(),
    enabled: z.boolean().optional(),
    failureAlerts: failureAlertConfigSchema.partial().optional(),
  })
  .openapi("UpdateEndpointGroupRequest");

export const eventTypeSchema = z
  .object({
    id: z.string(),
    environmentId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    schema: genericObjectSchema.nullable().optional(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("EventType");

export const eventTypeCreateSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    schema: genericObjectSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .openapi("CreateEventTypeRequest");

export const eventTypeUpdateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    schema: genericObjectSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .openapi("UpdateEventTypeRequest");

export const portalTokenRequestSchema = z
  .object({
    allowedEventTypes: z.array(z.string()).optional(),
    applicationName: z.string().optional(),
    returnUrl: z.string().url().optional(),
  })
  .openapi("CreatePortalTokenRequest");

export const portalTokenResponseSchema = z
  .object({
    token: z.string(),
    portalUrl: z.string(),
    expiresIn: z.union([z.string(), z.number()]).optional(),
    endpointGroup: z.object({
      id: z.string(),
      name: z.string(),
      environmentId: z.string(),
    }),
  })
  .openapi("PortalTokenResponse");

export const deleteResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi("DeleteResponse");

export const retryResponseSchema = z
  .object({
    message: z.string(),
    retryId: z.string(),
    originalMessageId: z.string(),
    endpointId: z.string(),
  })
  .openapi("RetryMessageResponse");

export const queueMetricsQuerySchema = z.object({
  timeRange: z.enum(["1h", "24h", "7d", "30d"]).optional(),
  includeRaw: z.enum(["true", "false"]).optional(),
});

export const queueMetricsSchema = z
  .object({
    backlog: z.object({
      messages: z.number(),
      bytes: z.number(),
    }),
    consumerConcurrency: z.number(),
    messageOperations: z.object({
      totalOperations: z.number(),
      totalBytes: z.number(),
      avgLagTime: z.number(),
      avgRetries: z.number(),
      maxMessageSize: z.number(),
    }),
    timeRange: z.string(),
    lastUpdated: z.string(),
    rawData: genericObjectSchema.optional(),
  })
  .openapi("QueueMetrics");
