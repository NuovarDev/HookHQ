import { NextRequest, NextResponse } from "next/server";
import { getCloudflareConfig, validateAdminAccess } from "@/lib/cloudflareConfig";
import { 
  QueueBacklogMetrics, 
  QueueConsumerMetrics, 
  QueueMessageOperationsMetrics, 
  CloudflareGraphQLResponse,
  TimeRange 
} from "@/lib/queueMetricsTypes";

// Cloudflare GraphQL Analytics API endpoint
const CLOUDFLARE_GRAPHQL_API = "https://api.cloudflare.com/client/v4/graphql";

/**
 * @swagger
 * /api/admin/queue-metrics:
 *   get:
 *     summary: Get Cloudflare Queue Metrics
 *     description: Retrieve queue metrics from Cloudflare's GraphQL Analytics API
 *     tags:
 *       - Admin
 *     parameters:
 *       - name: timeRange
 *         in: query
 *         description: Time range for metrics (1h, 24h, 7d, 30d)
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 backlog:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: number
 *                       description: Average backlog messages
 *                     bytes:
 *                       type: number
 *                       description: Average backlog bytes
 *                 consumerConcurrency:
 *                   type: number
 *                   description: Average consumer concurrency
 *                 messageOperations:
 *                   type: object
 *                   properties:
 *                     totalOperations:
 *                       type: number
 *                     totalBytes:
 *                       type: number
 *                     avgLagTime:
 *                       type: number
 *                     avgRetries:
 *                       type: number
 *                     maxMessageSize:
 *                       type: number
 *                 timeRange:
 *                   type: string
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const hasAccess = await validateAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "24h";
    const includeRaw = searchParams.get("includeRaw") === "true";

    // Get Cloudflare configuration
    const cloudflareConfig = await getCloudflareConfig();
    if (!cloudflareConfig) {
      return NextResponse.json({ 
        error: "Cloudflare credentials not configured. Please configure Cloudflare API token, Account ID, and Queue ID in the admin settings." 
      }, { status: 400 });
    }

    // Calculate time range
    const now = new Date();
    const timeRangeMs = getTimeRangeMs(timeRange as TimeRange);
    const startTime = new Date(now.getTime() - timeRangeMs);

    // Fetch metrics from Cloudflare GraphQL API
    const [backlogMetrics, consumerMetrics, messageOpsMetrics] = await Promise.all([
      fetchQueueBacklogMetrics(cloudflareConfig.cloudflareApiKey, cloudflareConfig.cloudflareAccountId, cloudflareConfig.cloudflareQueueId, startTime, now),
      fetchQueueConsumerMetrics(cloudflareConfig.cloudflareApiKey, cloudflareConfig.cloudflareAccountId, cloudflareConfig.cloudflareQueueId, startTime, now),
      fetchQueueMessageOperationsMetrics(cloudflareConfig.cloudflareApiKey, cloudflareConfig.cloudflareAccountId, cloudflareConfig.cloudflareQueueId, startTime, now)
    ]);

    console.log(messageOpsMetrics);

    // Process and aggregate the metrics
    const processedMetrics = {
      backlog: {
        messages: backlogMetrics.length > 0 ? backlogMetrics.reduce((sum, m) => sum + m.avg.messages, 0) / backlogMetrics.length : 0,
        bytes: backlogMetrics.length > 0 ? backlogMetrics.reduce((sum, m) => sum + m.avg.bytes, 0) / backlogMetrics.length : 0
      },
      consumerConcurrency: consumerMetrics.length > 0 ? consumerMetrics.reduce((sum, m) => sum + m.avg.concurrency, 0) / consumerMetrics.length : 0,
      messageOperations: {
        totalOperations: messageOpsMetrics.reduce((sum, m) => sum + m.count, 0),
        totalBytes: messageOpsMetrics.reduce((sum, m) => sum + m.sum.bytes, 0),
        avgLagTime: messageOpsMetrics.length > 0 ? messageOpsMetrics.reduce((sum, m) => sum + m.avg.lagTime, 0) / messageOpsMetrics.length : 0,
        avgRetries: messageOpsMetrics.length > 0 ? messageOpsMetrics.reduce((sum, m) => sum + m.avg.retryCount, 0) / messageOpsMetrics.length : 0,
        maxMessageSize: messageOpsMetrics.length > 0 ? Math.max(...messageOpsMetrics.map(m => m.max.messageSize)) : 0
      },
      timeRange,
      lastUpdated: new Date().toISOString()
    };

    // Include raw data if requested
    if (includeRaw) {
      (processedMetrics as any).rawData = {
        backlog: backlogMetrics,
        consumer: consumerMetrics,
        operations: messageOpsMetrics
      };
    }

    return NextResponse.json(processedMetrics);

  } catch (error) {
    console.error("Error fetching queue metrics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Fetch queue backlog metrics from Cloudflare GraphQL API
 */
async function fetchQueueBacklogMetrics(
  apiKey: string,
  accountId: string,
  queueId: string,
  startTime: Date,
  endTime: Date
): Promise<QueueBacklogMetrics[]> {
  const query = `
    query QueueBacklog($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          queueBacklogAdaptiveGroups(
            limit: 10000
            filter: {
              queueId: $queueId
              datetime_geq: $datetimeStart
              datetime_leq: $datetimeEnd
            }
          ) {
            avg {
              messages
              bytes
            }
            dimensions {
              datetime
            }
          }
        }
      }
    }
  `;

  const response = await fetch(CLOUDFLARE_GRAPHQL_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        queueId,
        datetimeStart: startTime.toISOString(),
        datetimeEnd: endTime.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
  }

  const result: CloudflareGraphQLResponse<QueueBacklogMetrics> = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(", ")}`);
  }

  return result.data.viewer.accounts[0]?.queueBacklogAdaptiveGroups || [];
}

/**
 * Fetch queue consumer metrics from Cloudflare GraphQL API
 */
async function fetchQueueConsumerMetrics(
  apiKey: string,
  accountId: string,
  queueId: string,
  startTime: Date,
  endTime: Date
): Promise<QueueConsumerMetrics[]> {
  const query = `
    query QueueConcurrency($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          queueConsumerMetricsAdaptiveGroups(
            limit: 10000
            filter: {
              queueId: $queueId
              datetime_geq: $datetimeStart
              datetime_leq: $datetimeEnd
            }
            orderBy: [datetimeHour_DESC]
          ) {
            avg {
              concurrency
            }
            dimensions {
              datetimeHour
            }
          }
        }
      }
    }
  `;

  const response = await fetch(CLOUDFLARE_GRAPHQL_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        queueId,
        datetimeStart: startTime.toISOString(),
        datetimeEnd: endTime.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
  }

  const result: CloudflareGraphQLResponse<QueueConsumerMetrics> = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(", ")}`);
  }

  return result.data.viewer.accounts[0]?.queueConsumerMetricsAdaptiveGroups || [];
}

/**
 * Fetch queue message operations metrics from Cloudflare GraphQL API
 */
async function fetchQueueMessageOperationsMetrics(
  apiKey: string,
  accountId: string,
  queueId: string,
  startTime: Date,
  endTime: Date
): Promise<QueueMessageOperationsMetrics[]> {
  const query = `
    query QueueMessageOperations($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          queueMessageOperationsAdaptiveGroups(
            limit: 10000
            filter: {
              queueId: $queueId
              datetime_geq: $datetimeStart
              datetime_leq: $datetimeEnd
            }
            orderBy: [datetimeMinute_DESC]
          ) {
            count
            sum {
              bytes
            }
            avg {
              lagTime
              retryCount
            }
            max {
              messageSize
            }
            dimensions {
              datetimeMinute
              actionType
              consumerType
              outcome
            }
          }
        }
      }
    }
  `;

  const response = await fetch(CLOUDFLARE_GRAPHQL_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        queueId,
        datetimeStart: startTime.toISOString(),
        datetimeEnd: endTime.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
  }

  const result: CloudflareGraphQLResponse<QueueMessageOperationsMetrics> = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(", ")}`);
  }

  return result.data.viewer.accounts[0]?.queueMessageOperationsAdaptiveGroups || [];
}

/**
 * Convert time range string to milliseconds
 */
function getTimeRangeMs(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1h":
      return 60 * 60 * 1000; // 1 hour
    case "24h":
      return 24 * 60 * 60 * 1000; // 24 hours
    case "7d":
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    case "30d":
      return 30 * 24 * 60 * 60 * 1000; // 30 days
    default:
      return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
}
