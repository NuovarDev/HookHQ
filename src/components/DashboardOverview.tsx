"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, Clock, XCircle, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"

const metrics = [
  {
    label: "Total Messages",
    value: "12,847",
    change: "+12.5%",
    icon: Send,
    color: "text-info",
  },
  {
    label: "Success Rate",
    value: "98.2%",
    change: "+2.1%",
    icon: CheckCircle2,
    color: "text-success",
  },
  {
    label: "Avg Queue Time",
    value: "1.2s",
    change: "-0.3s",
    icon: Clock,
    color: "text-warning",
  },
  {
    label: "Failed Messages",
    value: "231",
    change: "-5.2%",
    icon: XCircle,
    color: "text-destructive",
  },
]

const recentEvents = [
  {
    id: "1",
    type: "user.created",
    endpoint: "https://api.example.com/webhooks",
    status: "delivered",
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    type: "payment.succeeded",
    endpoint: "https://api.example.com/webhooks",
    status: "delivered",
    timestamp: "5 minutes ago",
  },
  {
    id: "3",
    type: "order.created",
    endpoint: "https://hooks.slack.com/services/...",
    status: "failed",
    timestamp: "12 minutes ago",
  },
  {
    id: "4",
    type: "user.updated",
    endpoint: "https://api.example.com/webhooks",
    status: "delivered",
    timestamp: "18 minutes ago",
  },
]

const quickLinks = [
  { label: "Create Endpoint", href: "/endpoints" },
  { label: "View All Events", href: "/metrics" },
  { label: "API Documentation", href: "/docs" },
  { label: "Webhook Logs", href: "/logs" },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your webhook performance and recent activity</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
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
        <Card className="border-border lg:col-span-2">
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Events</h2>
              <Link href="/metrics">
                <Button variant="ghost" size="sm" className="gap-2">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-6">
                <div
                  className={cn("h-2 w-2 rounded-full", event.status === "delivered" ? "bg-success" : "bg-destructive")}
                />
                <div className="flex-1 space-y-1">
                  <p className="font-mono text-sm font-medium">{event.type}</p>
                  <p className="text-sm text-muted-foreground">{event.endpoint}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      event.status === "delivered" ? "text-success" : "text-destructive",
                    )}
                  >
                    {event.status}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="border-border">
          <div className="border-b border-border p-6">
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
