"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Plus, 
    Globe, 
    Settings, 
    Clock, 
    Shield, 
    RefreshCw,
    Edit,
    Trash2,
    Power,
    PowerOff,
    Hash,
    Users,
    Copy,
    Check,
    LoaderCircle,
    CircleX
} from "lucide-react";
import EditableTemplate from "./EditableTemplate";
import { useState, useEffect } from "react";

interface Endpoint {
    id: string;
    environmentId: string;
    name: string;
    description?: string;
    url: string;
    secret?: string;
    enabled: boolean;
    retryPolicy: string;
    maxAttempts: number;
    timeoutMs: number;
    customHeaders?: Record<string, string>;
    proxyGroupId?: string;
    createdAt: string;
    updatedAt: string;
}

interface ProxyGroup {
    id: string;
    name: string;
    description?: string;
    loadBalancingStrategy: string;
    isActive: boolean;
}

export default function EndpointsTab() {
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [proxyGroups, setProxyGroups] = useState<ProxyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        url: "",
        secret: "",
        enabled: true,
        retryPolicy: "exponential_backoff",
        maxAttempts: 3,
        timeoutMs: 10000,
        customHeaders: "",
        proxyGroupId: "none"
    });


    const fetchEndpoints = async () => {
        try {
            const response = await fetch("/api/endpoints");
            if (!response.ok) {
                throw new Error("Failed to fetch endpoints");
            }
            const data = await response.json() as { endpoints: Endpoint[] };
            setEndpoints(data.endpoints);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const fetchProxyGroups = async () => {
        try {
            const response = await fetch("/api/proxy-groups?active=true");
            if (!response.ok) {
                throw new Error("Failed to fetch proxy groups");
            }
            const data = await response.json() as { proxyGroups: ProxyGroup[] };
            setProxyGroups(data.proxyGroups || []);
        } catch (err) {
            console.error("Error fetching proxy groups:", err);
        }
    };

    useEffect(() => {
        fetchEndpoints();
        fetchProxyGroups();
    }, []);

    const handleCreateEndpoint = async () => {
        try {
            const customHeaders = formData.customHeaders 
                ? JSON.parse(formData.customHeaders) 
                : {};

            const response = await fetch("/api/endpoints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    customHeaders,
                    proxyGroupId: formData.proxyGroupId === "none" ? "" : formData.proxyGroupId
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create endpoint");
            }

            const newEndpoint = await response.json() as Endpoint;
            setEndpoints(prev => [...prev, newEndpoint]);
            setCreateDialogOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create endpoint");
        }
    };

    const handleToggleEndpoint = async (id: string, enabled: boolean) => {
        try {
            const response = await fetch(`/api/endpoints/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled }),
            });

            if (!response.ok) {
                throw new Error("Failed to update endpoint");
            }

            setEndpoints(prev =>
                prev.map(endpoint =>
                    endpoint.id === id ? { ...endpoint, enabled } : endpoint
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update endpoint");
        }
    };

    const handleDeleteEndpoint = async (id: string) => {
        if (!confirm("Are you sure you want to delete this endpoint?")) return;

        try {
            const response = await fetch(`/api/endpoints/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete endpoint");
            }

            setEndpoints(prev => prev.filter(endpoint => endpoint.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete endpoint");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            url: "",
            secret: "",
            enabled: true,
            retryPolicy: "exponential_backoff",
            maxAttempts: 3,
            timeoutMs: 10000,
            customHeaders: "",
            proxyGroupId: "none"
        });
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };



    const openEditDialog = (endpoint: Endpoint) => {
        setFormData({
            name: endpoint.name,
            description: endpoint.description || "",
            url: endpoint.url,
            secret: endpoint.secret || "",
            enabled: endpoint.enabled,
            retryPolicy: endpoint.retryPolicy,
            maxAttempts: endpoint.maxAttempts,
            timeoutMs: endpoint.timeoutMs,
            customHeaders: endpoint.customHeaders ? JSON.stringify(endpoint.customHeaders, null, 2) : "",
            proxyGroupId: endpoint.proxyGroupId || "none"
        });
        setEditingEndpoint(endpoint);
        setCreateDialogOpen(true);
    };

    const handleUpdateEndpoint = async () => {
        if (!editingEndpoint) return;

        try {
            const customHeaders = formData.customHeaders 
                ? JSON.parse(formData.customHeaders) 
                : {};

            const response = await fetch(`/api/endpoints/${editingEndpoint.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    customHeaders,
                    proxyGroupId: formData.proxyGroupId === "none" ? "" : formData.proxyGroupId
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update endpoint");
            }

            const updatedEndpoint = await response.json() as Endpoint;
            setEndpoints(prev =>
                prev.map(endpoint =>
                    endpoint.id === editingEndpoint.id ? updatedEndpoint : endpoint
                )
            );
            setCreateDialogOpen(false);
            setEditingEndpoint(null);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update endpoint");
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Endpoints</h2>
                    <p className="text-muted-foreground">Manage your webhook endpoints</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Endpoint
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingEndpoint ? "Edit Endpoint" : "Create New Endpoint"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingEndpoint 
                                    ? "Update your webhook endpoint configuration"
                                    : "Add a new webhook endpoint to receive notifications"
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="My Webhook Endpoint"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="url">URL *</Label>
                                    <Input
                                        id="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://example.com/webhook"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secret">Secret</Label>
                                <Input
                                    id="secret"
                                    value={formData.secret}
                                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                                    placeholder="Optional webhook secret for verification"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="retryPolicy">Retry Policy</Label>
                                    <Select value={formData.retryPolicy} onValueChange={(value) => setFormData(prev => ({ ...prev, retryPolicy: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="linear">Linear</SelectItem>
                                            <SelectItem value="exponential_backoff">Exponential Backoff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxAttempts">Max Attempts</Label>
                                    <Input
                                        id="maxAttempts"
                                        type="number"
                                        value={formData.maxAttempts}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timeoutMs">Timeout (ms)</Label>
                                    <Input
                                        id="timeoutMs"
                                        type="number"
                                        value={formData.timeoutMs}
                                        onChange={(e) => setFormData(prev => ({ ...prev, timeoutMs: parseInt(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customHeaders">Custom Headers (JSON)</Label>
                                <textarea
                                    id="customHeaders"
                                    className="w-full min-h-[100px] p-2 border rounded-md"
                                    value={formData.customHeaders}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customHeaders: e.target.value }))}
                                    placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="proxyGroupId">Proxy Group (Optional)</Label>
                                <Select 
                                    value={formData.proxyGroupId} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, proxyGroupId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select proxy group for static IP delivery" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Direct Delivery (No Proxy)</SelectItem>
                                        {proxyGroups.length > 0 ? (
                                            proxyGroups.map((group) => (
                                                <SelectItem key={group.id} value={group.id}>
                                                    {group.name} ({group.loadBalancingStrategy})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-groups" disabled>
                                                No proxy groups available
                                            </SelectItem>
                                        )}
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
                            <Button onClick={editingEndpoint ? handleUpdateEndpoint : handleCreateEndpoint}>
                                {editingEndpoint ? "Update" : "Create"} Endpoint
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <LoaderCircle className="h-12 w-12 mb-4 animate-spin text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Loading...</h3>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <CircleX className="h-12 w-12 text-red-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Error</h3>
                        <p className="text-red-600 text-center">
                            {error}
                        </p>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && (endpoints.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Endpoints</h3>
                        <p className="text-muted-foreground text-center">
                            Create your first webhook endpoint to start receiving notifications.
                        </p>
                        <code className="text-sm m-4 p-4 bg-neutral-600 dark:bg-neutral-800 rounded-md text-white min-w-[500px]">
                            <EditableTemplate
                                template={`curl {{baseUrl}}/api/endpoints \\
-H 'Content-Type: application/json' \\
-H 'Authorization: Bearer {{apiKey="API KEY"}}' \\
-d '{
    "name": "My First Endpoint",
    "url": "https://example.com/webhook" 
}'`}
                                className="whitespace-pre"
                            />
                        </code>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {endpoints.map((endpoint) => (
                        <Card key={endpoint.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            {endpoint.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {endpoint.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(endpoint)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteEndpoint(endpoint.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-sm font-medium mb-1">URL</h4>
                                        <div className="text-sm text-muted-foreground break-all">
                                            {endpoint.url}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-3 w-3 text-gray-400" />
                                            <span className="text-muted-foreground">Endpoint ID:</span>
                                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
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
                                                <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded flex items-center gap-1">
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
                                            <Badge variant="outline">
                                                {endpoint.retryPolicy}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleEndpoint(endpoint.id, !endpoint.enabled)}
                                        >
                                            {endpoint.enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Max Attempts:</span>
                                            <span className="ml-1">{endpoint.maxAttempts}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Timeout:</span>
                                            <span className="ml-1">{endpoint.timeoutMs}ms</span>
                                        </div>
                                    </div>

                                    {endpoint.secret && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-1">Secret</h4>
                                            <div className="text-sm text-gray-600 font-mono">
                                                {endpoint.secret.substring(0, 8)}...
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ))}
        </div>
    );
}
