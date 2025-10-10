"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Copy, Search, RefreshCw, ChevronDown, Info, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePortalContext } from "../../../layout";

interface Endpoint {
  id: string;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topics: string[];
  retryPolicy: string;
  maxRetries: number;
  timeoutMs: number;
  headers?: any;
}

interface Metrics {
  totalEvents24h: number;
  totalEvents7d: number;
  successfulEvents24h: number;
  successfulEvents7d: number;
  errorRate24h: string;
  errorRate7d: string;
  chartData24h: Array<{
    time: string;
    count: number;
    success: number;
    failed: number;
    errorRate: string;
  }>;
  chartData7d: Array<{
    time: string;
    count: number;
    success: number;
    failed: number;
    errorRate: string;
  }>;
}

interface Event {
  attemptId: string;
  messageId: string;
  eventId?: string;
  eventType?: string;
  createdAt: string;
  attemptedAt: string;
  completedAt?: string;
  attemptNumber: number;
  maxAttempts: number;
  requestBody?: string;
  responseStatus?: number;
  responseHeaders?: string;
  responseBody?: string;
  responseTimeMs?: number;
  status: string;
  errorMessage?: string;
}

interface EventType {
  id: string;
  name: string;
  description?: string;
}

interface EndpointDetailPageProps {
  params: Promise<{ id: string; slug?: string[] }>;
}

export default function EndpointDetailPage({ params }: EndpointDetailPageProps) {
  const { token, setBreadcrumbTitle } = usePortalContext();
  const [resolvedParams, setResolvedParams] = useState<{ id: string; slug?: string[] }>({ id: "" });

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const endpointId = resolvedParams.id;

  // Determine active tab from URL slug
  const activeTab = resolvedParams.slug?.[0] || "overview";

  // Local state for tab management
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Sync local state with URL when params resolve
  useEffect(() => {
    if (resolvedParams.slug) {
      setCurrentTab(resolvedParams.slug[0] || "overview");
    }
  }, [resolvedParams.slug]);

  const handleTabChange = (value: string) => {
    // Update local state immediately for instant UI response
    setCurrentTab(value);
    // Update URL without causing a full page reload
    const newUrl = `/portal/endpoints/${endpointId}/${value}`;
    window.history.pushState(null, "", newUrl);
  };
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Data state
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [availableEventTypes, setAvailableEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time range state for each chart
  const [eventVolumeTimeRange, setEventVolumeTimeRange] = useState<"24h" | "7d">("7d");
  const [errorRateTimeRange, setErrorRateTimeRange] = useState<"24h" | "7d">("7d");

  useEffect(() => {
    if (endpointId) {
      fetchEndpointData();
    }
  }, [endpointId, token]);

  // Set breadcrumb title when endpoint data is loaded
  useEffect(() => {
    if (endpoint && setBreadcrumbTitle) {
      setBreadcrumbTitle(endpoint.name);
    }

    // Cleanup: reset breadcrumb when component unmounts
    return () => {
      if (setBreadcrumbTitle) {
        setBreadcrumbTitle(undefined);
      }
    };
  }, [endpoint, setBreadcrumbTitle]);

  const fetchEndpointData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/portal/endpoints/${endpointId}?token=${encodeURIComponent(token)}`);

      if (!response.ok) {
        throw new Error("Failed to fetch endpoint data");
      }

      const data = (await response.json()) as {
        endpoint: Endpoint;
        metrics: Metrics;
        recentEvents: Event[];
        availableEventTypes: EventType[];
      };
      setEndpoint(data.endpoint);
      setMetrics(data.metrics);
      setRecentEvents(data.recentEvents);
      setAvailableEventTypes(data.availableEventTypes);
      setSelectedTopics(data.endpoint.topics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch endpoint data");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => (prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading endpoint details...</p>
        </div>
      </div>
    );
  }

  if (error || !endpoint) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Endpoint not found"}</p>
          <Link href="/portal/endpoints">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Endpoints
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/portal/endpoints"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Endpoints
          </Link>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 bg-muted flex items-center justify-center">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{endpoint.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground font-mono">{endpoint.url}</p>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                endpoint.isActive ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-600"
              }`}
            >
              <div className={`h-1.5 w-1.5 ${endpoint.isActive ? "bg-green-600" : "bg-gray-600"}`} />
              {endpoint.isActive ? "Active" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="mb-2 rounded-none w-full">
            <TabsTrigger value="overview" className="rounded-none dark:data-[state=active]:bg-neutral-700/50">
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-none dark:data-[state=active]:bg-neutral-700/50">
              Events
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none dark:data-[state=active]:bg-neutral-700/50">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Details */}
            <Card className="border-0">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">ID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-sm">{endpoint.id}</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                          endpoint.isActive ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        {endpoint.isActive ? "Active" : "Disabled"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created at</Label>
                    <p className="font-mono text-sm mt-1">{new Date(endpoint.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last updated at</Label>
                    <p className="font-mono text-sm mt-1">{new Date(endpoint.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Topics</Label>
                  <p className="font-mono text-sm mt-1">
                    {endpoint.topics.length > 0 ? endpoint.topics.join(", ") : "No topics configured"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Charts Grid - Side by side on large screens, stacked on small screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Volume Chart */}
              <Card className="border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Event Volume</CardTitle>
                      <CardDescription>Total events over time</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={eventVolumeTimeRange === "7d" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEventVolumeTimeRange("7d")}
                      >
                        7d
                      </Button>
                      <Button
                        variant={eventVolumeTimeRange === "24h" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEventVolumeTimeRange("24h")}
                      >
                        24h
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm font-medium">Total events</p>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {eventVolumeTimeRange === "24h" ? metrics?.totalEvents24h || 0 : metrics?.totalEvents7d || 0}
                    </p>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={eventVolumeTimeRange === "24h" ? metrics?.chartData24h || [] : metrics?.chartData7d || []}
                      >
                        <XAxis
                          dataKey="time"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          interval={eventVolumeTimeRange === "24h" ? 3 : 0}
                        />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background border border-border p-2 shadow-lg">
                                  <p className="text-sm font-mono">{payload[0].value} events</p>
                                  <p className="text-xs text-muted-foreground">{payload[0].payload.time}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" opacity={0.6} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Error Rate Chart */}
              <Card className="border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Error Rate</CardTitle>
                      <CardDescription>Failed events percentage over time</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={errorRateTimeRange === "7d" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setErrorRateTimeRange("7d")}
                      >
                        7d
                      </Button>
                      <Button
                        variant={errorRateTimeRange === "24h" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setErrorRateTimeRange("24h")}
                      >
                        24h
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm font-medium">Error rate</p>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {errorRateTimeRange === "24h" ? metrics?.errorRate24h || "0.0" : metrics?.errorRate7d || "0.0"}%
                    </p>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={errorRateTimeRange === "24h" ? metrics?.chartData24h || [] : metrics?.chartData7d || []}
                      >
                        <XAxis
                          dataKey="time"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          interval={errorRateTimeRange === "24h" ? 3 : 0}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={value => `${value.toFixed(1)}%`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background border border-border p-2 shadow-lg">
                                  <p className="text-sm font-mono">{payload[0].payload.errorRate}%</p>
                                  <p className="text-xs text-muted-foreground">{payload[0].payload.time}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Events</CardTitle>
                    <CardDescription>{recentEvents.length} events</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-0 bg-transparent">
                      <Search className="mr-2 h-4 w-4" />
                      Filter by ID
                    </Button>
                    <Button variant="outline" size="sm" className="border-0 bg-transparent">
                      Last 24h
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-0 bg-transparent">
                      Status
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-0 bg-transparent">
                      Topics
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-0 bg-transparent" onClick={fetchEndpointData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {/* Events List */}
                  <div className="flex-1">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium text-sm text-muted-foreground">Timestamp</th>
                          <th className="text-left p-3 font-medium text-sm text-muted-foreground">Status</th>
                          <th className="text-left p-3 font-medium text-sm text-muted-foreground">Topic</th>
                          <th className="text-left p-3 font-medium text-sm text-muted-foreground">Message ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEvents.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                                  <Search className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">No events found</p>
                                  <p className="text-xs text-muted-foreground">
                                    Events will appear here when webhooks are triggered
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          recentEvents.map(event => (
                            <tr
                              key={event.attemptId}
                              className={`border-b border-border hover:bg-accent/50 cursor-pointer transition-colors ${
                                selectedEvent === event.attemptId ? "bg-accent/50" : ""
                              }`}
                              onClick={() => setSelectedEvent(event.attemptId)}
                            >
                              <td className="p-3 font-mono text-sm">{new Date(event.attemptedAt).toLocaleString()}</td>
                              <td className="p-3">
                                {event.status === "delivered" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 text-xs font-medium">
                                    Successful
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-600 text-xs font-medium">
                                    Failed
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-sm">{event.eventType}</td>
                              <td className="p-3 font-mono text-sm text-muted-foreground">
                                {event.messageId.slice(0, 24)}...
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Event Detail Panel */}
                  {selectedEvent &&
                    (() => {
                      const event = recentEvents.find(e => e.attemptId === selectedEvent);
                      if (!event) return null;

                      return (
                        <div className="w-96 border-l border-border pl-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Event</span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
                                    event.status === "delivered"
                                      ? "bg-green-500/10 text-green-600"
                                      : "bg-red-500/10 text-red-600"
                                  }`}
                                >
                                  {event.status === "delivered" ? "Successful" : "Failed"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">Attempts</span>
                                <span className="inline-flex items-center justify-center h-5 w-5 bg-muted text-xs font-medium">
                                  {event.attemptNumber}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Event Type</span>
                                </div>
                                <div className="bg-muted p-3 font-mono text-xs">{event.eventType}</div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Message ID</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="bg-muted p-3 font-mono text-xs">{event.messageId}</div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Timestamp</span>
                                </div>
                                <div className="bg-muted p-3 font-mono text-xs">
                                  {new Date(event.createdAt).toISOString()}
                                </div>
                              </div>

                              {event.attemptedAt && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Last Attempt</span>
                                  </div>
                                  <div className="bg-muted p-3 font-mono text-xs">
                                    {new Date(event.attemptedAt).toISOString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Event Topics */}
            <Card className="border-0">
              <CardHeader>
                <CardTitle>Event Topics</CardTitle>
                <CardDescription>Select which event types this endpoint should receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Filter topics..." className="pl-9 border-0" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 hover:bg-accent/50">
                    <Checkbox
                      id="select-all"
                      checked={selectedTopics.length === availableEventTypes.length}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedTopics(availableEventTypes.map(et => et.name));
                        } else {
                          setSelectedTopics([]);
                        }
                      }}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All
                    </label>
                  </div>

                  {availableEventTypes.map(eventType => (
                    <div key={eventType.id} className="flex items-center space-x-2 p-2 hover:bg-accent/50">
                      <Checkbox
                        id={eventType.name}
                        checked={selectedTopics.includes(eventType.name)}
                        onCheckedChange={() => toggleTopic(eventType.name)}
                      />
                      <label htmlFor={eventType.name} className="text-sm font-mono cursor-pointer flex-1">
                        {eventType.name}
                      </label>
                      {eventType.description && (
                        <span className="text-xs text-muted-foreground">{eventType.description}</span>
                      )}
                    </div>
                  ))}
                </div>

                <Button>Save</Button>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card className="border-0">
              <CardHeader>
                <CardTitle>Configuration & Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="border-0 bg-transparent">
                  <Info className="mr-2 h-4 w-4" />
                  Configuration Guide
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL *</Label>
                  <Input id="webhook-url" defaultValue={endpoint.url} className="border-0 font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">The URL to send webhook events to via HTTP POST</p>
                </div>

                <Button>Save</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
