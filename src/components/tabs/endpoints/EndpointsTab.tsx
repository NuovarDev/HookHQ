"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Edit, Globe, Hash, Plus, Power, PowerOff, Trash2, Users } from "lucide-react";
import EditableTemplate from "@/components/EditableTemplate";
import { EmptyStateCard, ErrorStateCard, LoadingStateCard } from "@/components/shared/resource-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createEndpoint,
  deleteEndpoint,
  fetchEndpoints,
  type Endpoint,
  updateEndpoint,
} from "@/lib/webhookApi";
import { getPublicApiUrl } from "@/lib/publicApi/utils";
import { ErrorBody } from "@/lib/webhookApi";

type EndpointFormState = {
  name: string;
  description: string;
  url: string;
  enabled: boolean;
  retryPolicy: "exponential" | "linear" | "fixed";
  maxAttempts: number;
  timeoutMs: number;
  customHeaders: string;
  proxyGroupId: string;
};

interface ProxyGroup {
  id: string;
  name: string;
  description?: string;
  loadBalancingStrategy: string;
  isActive: boolean;
}

const initialFormState: EndpointFormState = {
  name: "",
  description: "",
  url: "",
  enabled: true,
  retryPolicy: "exponential",
  maxAttempts: 3,
  timeoutMs: 10_000,
  customHeaders: "",
  proxyGroupId: "none",
};

async function fetchProxyGroups() {
  const response = await fetch("/api/proxy-groups?active=true");

  if (!response.ok) {
    console.error("Failed to fetch proxy groups", response);
    return [];
  }

  try {
    const data = (await response.json()) as { proxyGroups: ProxyGroup[] };
    return data.proxyGroups;
  } catch {
    console.error("Failed to parse proxy groups", response);
    return [];
  }
}

function getEndpointPayload(formData: EndpointFormState) {
  const customHeaders = formData.customHeaders.trim()
    ? (JSON.parse(formData.customHeaders) as Record<string, string>)
    : undefined;

  return {
    name: formData.name.trim(),
    description: formData.description.trim() || undefined,
    url: formData.url.trim(),
    enabled: formData.enabled,
    retryPolicy: formData.retryPolicy,
    maxAttempts: formData.maxAttempts,
    timeoutMs: formData.timeoutMs,
    customHeaders,
    proxyGroupId: formData.proxyGroupId === "none" ? undefined : formData.proxyGroupId,
  };
}

export default function EndpointsTab() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EndpointFormState>(initialFormState);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [nextEndpoints, nextProxyGroups] = await Promise.all([fetchEndpoints(), fetchProxyGroups()]);
        if (!isMounted) return;
        setEndpoints(nextEndpoints);
        setProxyGroups(nextProxyGroups);
      } catch (nextError) {
        if (!isMounted) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load endpoints");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  function resetForm() {
    setFormData(initialFormState);
    setEditingEndpoint(null);
  }

  function openCreateDialog() {
    resetForm();
    setCreateDialogOpen(true);
  }

  function openEditDialog(endpoint: Endpoint) {
    setFormData({
      name: endpoint.name,
      description: endpoint.description || "",
      url: endpoint.url,
      enabled: endpoint.enabled,
      retryPolicy: (endpoint.retryPolicy as EndpointFormState["retryPolicy"]) || "exponential",
      maxAttempts: endpoint.maxAttempts,
      timeoutMs: endpoint.timeoutMs,
      customHeaders: endpoint.customHeaders ? JSON.stringify(endpoint.customHeaders, null, 2) : "",
      proxyGroupId: endpoint.proxyGroupId || "none",
    });
    setEditingEndpoint(endpoint);
    setCreateDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      setError(null);
      const payload = getEndpointPayload(formData);

      if (editingEndpoint) {
        const updatedEndpoint = await updateEndpoint(editingEndpoint.id, payload);
        setEndpoints(current =>
          current.map(endpoint => (endpoint.id === editingEndpoint.id ? updatedEndpoint : endpoint))
        );
      } else {
        const createdEndpoint = await createEndpoint(payload);
        setEndpoints(current => [...current, createdEndpoint]);
      }

      setCreateDialogOpen(false);
      resetForm();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save endpoint");
    }
  }

  async function handleToggleEndpoint(endpoint: Endpoint) {
    try {
      setError(null);
      const updatedEndpoint = await updateEndpoint(endpoint.id, { enabled: !endpoint.enabled });
      setEndpoints(current => current.map(item => (item.id === endpoint.id ? updatedEndpoint : item)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update endpoint");
    }
  }

  async function handleDeleteEndpoint(id: string) {
    if (!confirm("Are you sure you want to delete this endpoint?")) return;

    try {
      setError(null);
      await deleteEndpoint(id);
      setEndpoints(current => current.filter(endpoint => endpoint.id !== id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to delete endpoint");
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to copy value");
    }
  }

  if (loading) {
    return <LoadingStateCard />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Endpoints</h2>
          <p className="text-muted-foreground">Manage your webhook endpoints</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEndpoint ? "Edit Endpoint" : "Create New Endpoint"}</DialogTitle>
              <DialogDescription>
                {editingEndpoint
                  ? "Update your webhook endpoint configuration"
                  : "Add a new webhook endpoint to receive notifications"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint-name">Name *</Label>
                  <Input
                    id="endpoint-name"
                    value={formData.name}
                    onChange={event => setFormData(current => ({ ...current, name: event.target.value }))}
                    placeholder="My Webhook Endpoint"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint-url">URL *</Label>
                  <Input
                    id="endpoint-url"
                    value={formData.url}
                    onChange={event => setFormData(current => ({ ...current, url: event.target.value }))}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint-description">Description</Label>
                <Input
                  id="endpoint-description"
                  value={formData.description}
                  onChange={event => setFormData(current => ({ ...current, description: event.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint-retry-policy">Retry Policy</Label>
                  <Select
                    value={formData.retryPolicy}
                    onValueChange={(value: EndpointFormState["retryPolicy"]) =>
                      setFormData(current => ({ ...current, retryPolicy: value }))
                    }
                  >
                    <SelectTrigger id="endpoint-retry-policy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exponential">Exponential</SelectItem>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endpoint-max-attempts">Max Attempts</Label>
                  <Input
                    id="endpoint-max-attempts"
                    type="number"
                    min={1}
                    value={formData.maxAttempts}
                    onChange={event =>
                      setFormData(current => ({
                        ...current,
                        maxAttempts: Number.parseInt(event.target.value || "1", 10),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endpoint-timeout">Timeout (ms)</Label>
                  <Input
                    id="endpoint-timeout"
                    type="number"
                    min={100}
                    value={formData.timeoutMs}
                    onChange={event =>
                      setFormData(current => ({
                        ...current,
                        timeoutMs: Number.parseInt(event.target.value || "100", 10),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint-custom-headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="endpoint-custom-headers"
                  className="min-h-[100px] font-mono text-sm"
                  value={formData.customHeaders}
                  onChange={event => setFormData(current => ({ ...current, customHeaders: event.target.value }))}
                  placeholder='{"Authorization":"Bearer token","X-Custom":"value"}'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint-proxy-group">Proxy Group (Optional)</Label>
                <Select
                  value={formData.proxyGroupId}
                  onValueChange={value => setFormData(current => ({ ...current, proxyGroupId: value }))}
                >
                  <SelectTrigger id="endpoint-proxy-group">
                    <SelectValue placeholder="Select proxy group for static IP delivery" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Direct Delivery (No Proxy)</SelectItem>
                    {proxyGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.loadBalancingStrategy})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Assign a proxy group to use static IP delivery, or leave empty for direct delivery.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>{editingEndpoint ? "Update" : "Create"} Endpoint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <ErrorStateCard message={error} />}

      {endpoints.length === 0 ? (
        <EmptyStateCard
          icon={Globe}
          title="No Endpoints"
          description="Create your first webhook endpoint to start receiving notifications."
        >
          <code className="m-4 min-w-[500px] rounded-md bg-neutral-600 p-4 text-sm text-white dark:bg-neutral-800">
            <EditableTemplate
              template={`curl ${getPublicApiUrl()}/endpoints \\
-H 'Content-Type: application/json' \\
-H 'Authorization: Bearer {{apiKey="API KEY"}}' \\
-d '{
  "name": "My First Endpoint",
  "url": "https://example.com/webhook"
}'`}
              className="whitespace-pre"
            />
          </code>
        </EmptyStateCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {endpoints.map(endpoint => (
            <Card key={endpoint.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="h-4 w-4" />
                      {endpoint.name}
                    </CardTitle>
                    <CardDescription>{endpoint.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(endpoint)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEndpoint(endpoint.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-1 text-sm font-medium">URL</h4>
                    <div className="break-all text-sm text-muted-foreground">{endpoint.url}</div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-gray-400" />
                      <span className="text-muted-foreground">Endpoint ID:</span>
                      <span className="flex items-center gap-1 rounded bg-muted px-2 py-1 font-mono text-xs">
                        {endpoint.id}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-gray-200"
                          onClick={() => copyToClipboard(endpoint.id, `endpoint-${endpoint.id}`)}
                        >
                          {copiedId === `endpoint-${endpoint.id}` ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </span>
                    </div>

                    {endpoint.proxyGroupId && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-muted-foreground">Proxy Group ID:</span>
                        <span className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 font-mono text-xs dark:bg-blue-900">
                          {endpoint.proxyGroupId}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-blue-200"
                            onClick={() => copyToClipboard(endpoint.proxyGroupId!, `proxy-${endpoint.proxyGroupId}`)}
                          >
                            {copiedId === `proxy-${endpoint.proxyGroupId}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={endpoint.enabled ? "default" : "secondary"}>
                        {endpoint.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant="outline">{endpoint.retryPolicy}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleEndpoint(endpoint)}>
                      {endpoint.enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
