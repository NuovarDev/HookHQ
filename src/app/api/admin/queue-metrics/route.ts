import { initAuth } from "@/auth";
import { getDb } from "@/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { serverConfig } from "@/db/environments.schema";
import { eq } from "drizzle-orm";
import { serializeAutoDisableConfig, serializeFailureAlertConfig } from "@/lib/destinations/config";
import type {
  CloudflareGraphQLResponse,
  QueueBacklogMetrics,
  QueueConsumerMetrics,
  QueueMessageOperationsMetrics,
  TimeRange,
} from "@/lib/queueMetricsTypes";
import { getCloudflareConfig } from "@/lib/cloudflareConfig";

const CLOUDFLARE_GRAPHQL_API = "https://api.cloudflare.com/client/v4/graphql";
type QueueMetricsField =
  | "queueBacklogAdaptiveGroups"
  | "queueConsumerMetricsAdaptiveGroups"
  | "queueMessageOperationsAdaptiveGroups";

// GET /api/admin/queue-metrics - Get queue metrics
export async function GET(request: NextRequest) {
  try {
    const authInstance = await initAuth();
    const session = await authInstance.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const timeRange = (query.timeRange ?? "24h") as TimeRange;
    const includeRaw = query.includeRaw === "true";

    const config = await getCloudflareConfig();

    if (!config) {
      return NextResponse.json({ error: "Cloudflare credentials not configured. Please configure Cloudflare API token, Account ID, and Queue ID in the admin settings." }, { status: 400 });
    }

    const now = new Date();
    const start = new Date(now.getTime() - getTimeRangeMs(timeRange));
    const [backlogMetrics, consumerMetrics, messageOpsMetrics] = await Promise.all([
      fetchQueueBacklogMetrics(
        config.cloudflareApiKey,
        config.cloudflareAccountId,
        config.cloudflareQueueId,
        start,
        now
      ),
      fetchQueueConsumerMetrics(
        config.cloudflareApiKey,
        config.cloudflareAccountId,
        config.cloudflareQueueId,
        start,
        now
      ),
      fetchQueueMessageOperationsMetrics(
        config.cloudflareApiKey,
        config.cloudflareAccountId,
        config.cloudflareQueueId,
        start,
        now
      ),
    ]);

    const response: Record<string, unknown> = {
      backlog: {
        messages:
          backlogMetrics.length > 0
            ? backlogMetrics.reduce((sum, m) => sum + m.avg.messages, 0) / backlogMetrics.length
            : 0,
        bytes:
          backlogMetrics.length > 0
            ? backlogMetrics.reduce((sum, m) => sum + m.avg.bytes, 0) / backlogMetrics.length
            : 0,
      },
      consumerConcurrency:
        consumerMetrics.length > 0
          ? consumerMetrics.reduce((sum, m) => sum + m.avg.concurrency, 0) / consumerMetrics.length
          : 0,
      messageOperations: {
        totalOperations: messageOpsMetrics.reduce((sum, m) => sum + m.count, 0),
        totalBytes: messageOpsMetrics.reduce((sum, m) => sum + m.sum.bytes, 0),
        avgLagTime:
          messageOpsMetrics.length > 0
            ? messageOpsMetrics.reduce((sum, m) => sum + m.avg.lagTime, 0) / messageOpsMetrics.length
            : 0,
        avgRetries:
          messageOpsMetrics.length > 0
            ? messageOpsMetrics.reduce((sum, m) => sum + m.avg.retryCount, 0) / messageOpsMetrics.length
            : 0,
        maxMessageSize: messageOpsMetrics.length > 0 ? Math.max(...messageOpsMetrics.map(m => m.max.messageSize)) : 0,
      },
      timeRange,
      lastUpdated: new Date().toISOString(),
    };

    if (includeRaw) {
      response.rawData = { backlog: backlogMetrics, consumer: consumerMetrics, operations: messageOpsMetrics };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching server config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchQueueBacklogMetrics(
  apiKey: string,
  accountId: string,
  queueId: string,
  startTime: Date,
  endTime: Date
): Promise<QueueBacklogMetrics[]> {
  const query = `
    query QueueBacklog($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) {
      viewer { accounts(filter: { accountTag: $accountTag }) { queueBacklogAdaptiveGroups(limit: 10000 filter: { queueId: $queueId datetime_geq: $datetimeStart datetime_leq: $datetimeEnd }) { avg { messages bytes } dimensions { datetime } } } }
    }
  `;
  return fetchGraphQl<QueueBacklogMetrics>(
    apiKey,
    { accountTag: accountId, queueId, datetimeStart: startTime.toISOString(), datetimeEnd: endTime.toISOString() },
    query,
    "queueBacklogAdaptiveGroups"
  );
}

async function fetchQueueConsumerMetrics(
  apiKey: string,
  accountId: string,
  queueId: string,
  startTime: Date,
  endTime: Date
): Promise<QueueConsumerMetrics[]> {
  const query = `
    query QueueConcurrency($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) {
      viewer { accounts(filter: { accountTag: $accountTag }) { queueConsumerMetricsAdaptiveGroups(limit: 10000 filter: { queueId: $queueId datetime_geq: $datetimeStart datetime_leq: $datetimeEnd } orderBy: [datetimeHour_DESC]) { avg { concurrency } dimensions { datetimeHour } } } }
    }
  `;
  return fetchGraphQl<QueueConsumerMetrics>(
    apiKey,
    { accountTag: accountId, queueId, datetimeStart: startTime.toISOString(), datetimeEnd: endTime.toISOString() },
    query,
    "queueConsumerMetricsAdaptiveGroups"
  );
}

async function fetchQueueMessageOperationsMetrics(
  apiKey: string,
  accountId: string,
  queueId: string,
  startTime: Date,
  endTime: Date
): Promise<QueueMessageOperationsMetrics[]> {
  const query = `
    query QueueOps($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) {
      viewer { accounts(filter: { accountTag: $accountTag }) { queueMessageOperationsAdaptiveGroups(limit: 10000 filter: { queueId: $queueId datetime_geq: $datetimeStart datetime_leq: $datetimeEnd } orderBy: [datetimeHour_DESC]) { count sum { bytes } avg { lagTime retryCount } max { messageSize } dimensions { datetimeHour } } } }
    }
  `;
  return fetchGraphQl<QueueMessageOperationsMetrics>(
    apiKey,
    { accountTag: accountId, queueId, datetimeStart: startTime.toISOString(), datetimeEnd: endTime.toISOString() },
    query,
    "queueMessageOperationsAdaptiveGroups"
  );
}

async function fetchGraphQl<T>(
  apiKey: string,
  variables: Record<string, string>,
  query: string,
  field: QueueMetricsField
): Promise<T[]> {
  const response = await fetch(CLOUDFLARE_GRAPHQL_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
  const result: CloudflareGraphQLResponse<T> = await response.json();
  if (result.errors) throw new Error(`GraphQL errors: ${result.errors.map(error => error.message).join(", ")}`);
  return result.data.viewer.accounts[0]?.[field] || [];
}

function getTimeRangeMs(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}
