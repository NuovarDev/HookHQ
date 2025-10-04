"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PortalTokenPayload } from "@/lib/portalAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ExternalLink, Copy, LoaderCircle, AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import CopyableCode from "@/components/CopyableCode";

interface Endpoint {
  id: string;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  timestamp: string;
  status: "success" | "failed" | "pending";
  topic: string;
  messageId: string;
  attempts: number;
  payload: any;
}

function EndpointDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const endpointId = params.id as string;
  const token = searchParams.get("token");
  const theme = searchParams.get("theme") as "light" | "dark" || "light";

  const [authState, setAuthState] = useState<{
    loading: boolean;
    authenticated: boolean;
    payload?: PortalTokenPayload;
    error?: string;
  }>({
    loading: true,
    authenticated: false
  });

  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    url: "",
    description: "",
    isActive: true
  });

  // Theme-based styling
  const cardClasses = theme === "dark" 
    ? "bg-gray-800 border-gray-700 text-white" 
    : "bg-white border-gray-200 text-gray-900";

  const textClasses = theme === "dark"
    ? "text-gray-300"
    : "text-gray-600";

  const headerClasses = theme === "dark"
    ? "text-white"
    : "text-gray-900";

  const iconClasses = theme === "dark"
    ? "text-gray-400"
    : "text-gray-600";

  const dividerClasses = theme === "dark"
    ? "bg-gray-600"
    : "bg-gray-300";

  useEffect(() => {
    if (!token) {
      setAuthState({
        loading: false,
        authenticated: false,
        error: "No access token provided"
      });
      return;
    }

    // Verify token
    fetch(`/api/portal/verify?token=${encodeURIComponent(token)}`)
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          setAuthState({
            loading: false,
            authenticated: true,
            payload: data.payload
          });
          fetchEndpointData();
        } else {
          setAuthState({
            loading: false,
            authenticated: false,
            error: data.error || "Token verification failed"
          });
        }
      })
      .catch(error => {
        setAuthState({
          loading: false,
          authenticated: false,
          error: "Failed to verify token"
        });
      });
  }, [token]);

  const fetchEndpointData = async () => {
    try {
      setLoading(true);
      
      // Fetch endpoint details
      const endpointResponse = await fetch(`/api/portal/endpoints?token=${encodeURIComponent(token!)}`);
      if (!endpointResponse.ok) throw new Error("Failed to fetch endpoints");
      
      const endpointData = await endpointResponse.json();
      const foundEndpoint = endpointData.endpoints?.find((ep: Endpoint) => ep.id === endpointId);
      
      if (!foundEndpoint) {
        setError("Endpoint not found");
        return;
      }
      
      setEndpoint(foundEndpoint);
      setEditForm({
        name: foundEndpoint.name,
        url: foundEndpoint.url,
        description: foundEndpoint.description || "",
        isActive: foundEndpoint.isActive
      });

      // Mock events data for now
      setEvents(generateMockEvents());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch endpoint data");
    } finally {
      setLoading(false);
    }
  };

  const generateMockEvents = (): Event[] => {
    const topics = ["user.created", "user.updated", "subscription.created", "payment.succeeded"];
    const statuses: ("success" | "failed" | "pending")[] = ["success", "failed", "pending"];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `event-${i}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      topic: topics[Math.floor(Math.random() * topics.length)],
      messageId: `msg-${Math.random().toString(36).substr(2, 9)}`,
      attempts: Math.floor(Math.random() * 3) + 1,
      payload: {
        id: `evt-${Math.random().toString(36).substr(2, 9)}`,
        type: topics[Math.floor(Math.random() * topics.length)],
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        data: {
          user_id: Math.floor(Math.random() * 1000),
          email: `user${i}@example.com`
        }
      }
    }));
  };

  const handleSaveChanges = async () => {
    if (!endpoint) return;

    try {
      const response = await fetch(`/api/portal/endpoints/${endpointId}?token=${encodeURIComponent(token!)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          url: editForm.url,
          description: editForm.description || undefined,
          isActive: editForm.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update endpoint");
      }

      const updatedEndpoint = await response.json();
      setEndpoint(updatedEndpoint);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update endpoint");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Successful</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (authState.loading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.authenticated || !authState.payload || !endpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <p className="text-red-600">{error || authState.error || "Not found"}</p>
          <Button onClick={() => {
            const url = new URL("/portal", window.location.origin);
            url.searchParams.set("token", token!);
            if (theme !== "light") {
              url.searchParams.set("theme", theme);
            }
            router.push(url.toString());
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Destinations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PortalLayout
      applicationName={authState.payload.applicationName}
      returnUrl={authState.payload.returnUrl}
      token={token!}
      theme={theme}
    >
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                const url = new URL("/portal", window.location.origin);
                url.searchParams.set("token", token!);
                if (theme !== "light") {
                  url.searchParams.set("theme", theme);
                }
                router.push(url.toString());
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Event Destinations
            </Button>
            <div className={`w-px h-6 ${dividerClasses}`} />
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} rounded-full flex items-center justify-center`}>
                <ExternalLink className={`h-4 w-4 ${iconClasses}`} />
              </div>
              <h1 className={`text-3xl font-bold ${headerClasses}`}>{endpoint.name}</h1>
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 text-sm ${textClasses}`}>
            <span className="font-mono">{endpoint.url}</span>
            <CopyableCode copyText={endpoint.url}>
              <Copy className="h-4 w-4" />
            </CopyableCode>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className={cardClasses}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium ${textClasses}`}>Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.5%</div>
                  <p className={`text-xs ${textClasses}`}>Last 24 hours</p>
                </CardContent>
              </Card>
              
              <Card className={cardClasses}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium ${textClasses}`}>Events Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className={`text-xs ${textClasses}`}>+12% from yesterday</p>
                </CardContent>
              </Card>
              
              <Card className={cardClasses}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium ${textClasses}`}>Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45ms</div>
                  <p className={`text-xs ${textClasses}`}>Last 24 hours</p>
                </CardContent>
              </Card>
            </div>

            <Card className={cardClasses}>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className={`flex items-center justify-between p-3 border rounded-lg ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(event.status)}
                        <div>
                          <div className="font-medium">{event.topic}</div>
                          <div className={`text-sm ${textClasses}`}>
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(event.status)}
                        <span className={`text-sm ${textClasses}`}>{event.attempts} attempts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Events {events.length}</h2>
              <div className="flex items-center space-x-4">
                <Input placeholder="Filter by ID" className="w-64" />
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card className={cardClasses}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                      <tr className="text-left">
                        <th className={`px-6 py-4 font-medium ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Timestamp</th>
                        <th className={`px-6 py-4 font-medium ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Status</th>
                        <th className={`px-6 py-4 font-medium ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Topic</th>
                        <th className={`px-6 py-4 font-medium ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Message ID</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
                      {events.map((event) => (
                        <tr key={event.id} className={theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                          <td className={`px-6 py-4 text-sm ${textClasses}`}>
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(event.status)}
                              {getStatusBadge(event.status)}
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm ${textClasses}`}>{event.topic}</td>
                          <td className={`px-6 py-4 text-sm ${textClasses} font-mono`}>
                            {event.messageId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className={cardClasses}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Endpoint Settings</CardTitle>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => {
                      if (isEditing) {
                        handleSaveChanges();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? "Save Changes" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={editForm.url}
                      onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={editForm.isActive}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}

export default function EndpointDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EndpointDetailPageContent />
    </Suspense>
  );
}
