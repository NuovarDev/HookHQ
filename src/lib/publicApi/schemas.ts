import { z } from "@hono/zod-openapi";

export const authHeaderSchema = z.object({
  authorization: z.string().optional().openapi({
    description: "Bearer API key",
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

export const retryPolicySchema = z.enum(["exponential", "linear", "fixed"]);

export const endpointSchema = z
  .object({
    id: z.string(),
    environmentId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    url: z.string(),
    enabled: z.boolean(),
    retryPolicy: retryPolicySchema.nullable().optional(),
    maxAttempts: z.number().nullable().optional(),
    timeoutMs: z.number().nullable().optional(),
    customHeaders: genericObjectSchema,
    proxyGroupId: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Endpoint");

export const endpointCreateSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    url: z.string().url(),
    enabled: z.boolean().optional(),
    retryPolicy: retryPolicySchema.optional(),
    maxAttempts: z.number().int().min(0).optional(),
    timeoutMs: z.number().int().min(0).optional(),
    customHeaders: z.record(z.string(), z.string()).optional(),
    proxyGroupId: z.string().optional(),
  })
  .openapi("CreateEndpointRequest");

export const endpointUpdateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    url: z.string().url().optional(),
    enabled: z.boolean().optional(),
    retryPolicy: retryPolicySchema.optional(),
    maxAttempts: z.number().int().min(0).optional(),
    timeoutMs: z.number().int().min(0).optional(),
    customHeaders: z.record(z.string(), z.string()).optional(),
    proxyGroupId: z.string().nullable().optional(),
  })
  .openapi("UpdateEndpointRequest");

export const endpointGroupSchema = z
  .object({
    id: z.string(),
    environmentId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    endpointIds: z.array(z.string()),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("EndpointGroup");

export const endpointGroupCreateSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    endpointIds: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
  })
  .openapi("CreateEndpointGroupRequest");

export const endpointGroupUpdateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    endpointIds: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
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
