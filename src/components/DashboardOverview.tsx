"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, Clock, XCircle, TrendingUp, ArrowRight, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MetricsData {
  summary: {
      totalMessages: number;
      deliveredMessages: number;
      failedMessages: number;
      successRate: number;
      avgQueueTime: number;
  };
  recentMessages: Array<{
    id: string;
    eventId?: string;
    eventType: string;
    status: string;
    createdAt: string;
    responseTimeMs?: number;
    attempts: number;
    destinations: string[];
  }>;
}

interface Metric {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

interface RecentEvent {
  id: string;
  type: string;
  endpoint: string;
  status: string;
  timestamp: string;
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
};

const displayMetrics = [
  {
    label: "Total Messages",
    value: "0",
    change: "0 delivered",
    icon: Send,
    color: "text-sky-500 dark:text-sky-700",
  },
  {
    label: "Success Rate",
    value: "0%",
    change: "0 failed",
    icon: CheckCircle2,
    color: "text-green-500 dark:text-green-700",
  },
  {
    label: "Avg Queue Time",
    value: formatDuration(0),
    change: "Time to processing",
    icon: Clock,
    color: "text-amber-500 dark:text-amber-700",
  },
  {
    label: "Failed Messages",
    value: "0",
    change: "0% of total",
    icon: XCircle,
    color: "text-red-500 dark:text-red-700",
  },
];

const quickLinks = [
  { label: "Create Endpoint", href: "/dashboard/webhooks" },
  { label: "View Metrics", href: "/dashboard/metrics" },
  { label: "Webhook Logs", href: "/dashboard/log" },
]

if (process.env.NEXT_PUBLIC_API_DOCS_ENABLED === "true") {
  quickLinks.push({ label: "API Documentation", href: "/api" });
}

export function DashboardOverview() {
  const [metrics, setMetrics] = useState<Metric[] | null>(displayMetrics);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/webhooks/metrics?timeRange=7d');
            if (!response.ok) {
                throw new Error('Failed to fetch metrics');
            }
            const data = await response.json() as MetricsData;

            const displayMetrics = [
              {
                label: "Total Messages",
                value: data.summary.totalMessages.toLocaleString(),
                change: `${data.summary.deliveredMessages} delivered`,
                icon: Send,
                color: "text-sky-500 dark:text-sky-700",
              },
              {
                label: "Success Rate",
                value: `${data.summary.successRate}%`,
                change: `${data.summary.failedMessages} failed`,
                icon: CheckCircle2,
                color: "text-green-500 dark:text-green-700",
              },
              {
                label: "Avg Queue Time",
                value: formatDuration(data.summary.avgQueueTime),
                change: "Time to processing",
                icon: Clock,
                color: "text-amber-500 dark:text-amber-700",
              },
              {
                label: "Failed Messages",
                value: data.summary.failedMessages.toLocaleString(),
                change: `${data.summary.totalMessages > 0 ? ((data.summary.failedMessages / data.summary.totalMessages) * 100).toFixed(1) : '0'}% of total`,
                icon: XCircle,
                color: "text-red-500 dark:text-red-700",
              },
            ];

            setMetrics(displayMetrics);

            const recentEvents = data.recentMessages.map((event) => ({
              id: event.id,
              type: event.eventType || "No event type",
              endpoint: event.destinations.join(", "),
              status: event.status,
              timestamp: event.createdAt,
            }));

            setRecentEvents(recentEvents);
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchMetrics();
}, []);

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your webhook performance and recent activity</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics?.map((metric) => (
          <Card key={metric.label} className="border-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {metric.change}
                </p>
              </div>
              <div className={cn("rounded-sm border border-border p-2", metric.color)}>
                <metric.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Events */}
        <Card className="border-border lg:col-span-2 gap-0">
          <div className="border-b border-border px-6 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Events</h2>
              <Link href="/dashboard/log">
                <Button variant="ghost" size="sm" className="gap-2">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border">
            {recentEvents?.map((event) => (
              <div key={event.id} className="flex items-center gap-4 py-4 pl-6 pr-10">
                <div
                  className={cn("h-2 w-2 rounded-full", event.status === "delivered" ? "bg-green-500 dark:bg-green-700" : "bg-red-500 dark:bg-red-700")}
                />
                <div className="flex-1 space-y-1">
                  <p className="font-mono text-sm font-medium">{event.type}</p>
                  <p className="text-sm text-muted-foreground">{event.endpoint}</p>
                  <p className="text-sm text-muted-foreground">{event.id}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      event.status === "delivered" ? "text-green-600 dark:text-green-700" : "text-red-500 dark:text-red-700",
                    )}
                  >
                    {event.status}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.timestamp}</p>
                </div>
              </div>
            ))}

            {recentEvents?.length === 0 && (
              <div className="flex items-center justify-center py-4 mt-8">
                <p className="text-muted-foreground">No recent events</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="border-border">
          <div className="border-b border-border px-6 pb-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="space-y-2 px-6 flex flex-col gap-1">
            {quickLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                <Button variant="outline" className="w-full justify-between bg-transparent p-6" size="sm">
                  {link.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
