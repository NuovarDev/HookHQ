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
    Users, 
    Globe, 
    Edit,
    Trash2,
    Power,
    PowerOff,
    Hash,
    Copy,
    Check
} from "lucide-react";
import { useState, useEffect } from "react";

interface Endpoint {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
}

interface EndpointGroup {
    id: string;
    environmentId: string;
    name: string;
    description?: string;
    endpointIds: string[];
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function EndpointGroupsTab() {
    const [endpointGroups, setEndpointGroups] = useState<EndpointGroup[]>([]);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<EndpointGroup | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        endpointIds: [] as string[],
        enabled: true
    });

    const fetchData = async () => {
        try {
            const [groupsResponse, endpointsResponse] = await Promise.all([
                fetch("/api/endpoint-groups"),
                fetch("/api/endpoints")
            ]);

            if (!groupsResponse.ok || !endpointsResponse.ok) {
                throw new Error("Failed to fetch data");
            }

            const groupsData = await groupsResponse.json() as { endpointGroups: EndpointGroup[] };
            const endpointsData = await endpointsResponse.json() as { endpoints: Endpoint[] };

            setEndpointGroups(groupsData.endpointGroups);
            setEndpoints(endpointsData.endpoints);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateGroup = async () => {
        try {
            const response = await fetch("/api/endpoint-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to create endpoint group");
            }

            const newGroup = await response.json() as EndpointGroup;
            setEndpointGroups(prev => [...prev, newGroup]);
            setCreateDialogOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create endpoint group");
        }
    };

    const handleToggleGroup = async (id: string, enabled: boolean) => {
        try {
            const response = await fetch(`/api/endpoint-groups/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled }),
            });

            if (!response.ok) {
                throw new Error("Failed to update endpoint group");
            }

            setEndpointGroups(prev =>
                prev.map(group =>
                    group.id === id ? { ...group, enabled } : group
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update endpoint group");
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm("Are you sure you want to delete this endpoint group?")) return;

        try {
            const response = await fetch(`/api/endpoint-groups/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete endpoint group");
            }

            setEndpointGroups(prev => prev.filter(group => group.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete endpoint group");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            endpointIds: [],
            enabled: true
        });
    };

    const openEditDialog = (group: EndpointGroup) => {
        setFormData({
            name: group.name,
            description: group.description || "",
            endpointIds: group.endpointIds,
            enabled: group.enabled
        });
        setEditingGroup(group);
        setCreateDialogOpen(true);
    };

    const handleUpdateGroup = async () => {
        if (!editingGroup) return;

        try {
            const response = await fetch(`/api/endpoint-groups/${editingGroup.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to update endpoint group");
            }

            const updatedGroup = await response.json() as EndpointGroup;
            setEndpointGroups(prev =>
                prev.map(group =>
                    group.id === editingGroup.id ? updatedGroup : group
                )
            );
            setCreateDialogOpen(false);
            setEditingGroup(null);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update endpoint group");
        }
    };

    const toggleEndpointSelection = (endpointId: string) => {
        setFormData(prev => ({
            ...prev,
            endpointIds: prev.endpointIds.includes(endpointId)
                ? prev.endpointIds.filter(id => id !== endpointId)
                : [...prev.endpointIds, endpointId]
        }));
    };

    const getEndpointName = (endpointId: string) => {
        const endpoint = endpoints.find(e => e.id === endpointId);
        return endpoint ? endpoint.name : endpointId;
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


    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="text-gray-600">Loading endpoint groups...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Endpoint Groups</h2>
                    <p className="text-gray-600">Group endpoints together for batch notifications</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingGroup ? "Edit Endpoint Group" : "Create New Endpoint Group"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingGroup 
                                    ? "Update your endpoint group configuration"
                                    : "Create a group of endpoints to receive notifications together"
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="My Endpoint Group"
                                />
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
                                <Label>Select Endpoints</Label>
                                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                                    {endpoints.length === 0 ? (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            No endpoints available. Create endpoints first.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {endpoints.map((endpoint) => (
                                                <label key={endpoint.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.endpointIds.includes(endpoint.id)}
                                                        onChange={() => toggleEndpointSelection(endpoint.id)}
                                                        className="rounded"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{endpoint.name}</div>
                                                        <div className="text-xs text-gray-500">{endpoint.url}</div>
                                                    </div>
                                                    <Badge variant={endpoint.enabled ? "default" : "secondary"}>
                                                        {endpoint.enabled ? "Enabled" : "Disabled"}
                                                    </Badge>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}>
                                {editingGroup ? "Update" : "Create"} Group
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {endpointGroups.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Endpoint Groups</h3>
                        <p className="text-gray-600 text-center">
                            Create your first endpoint group to send notifications to multiple endpoints at once.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {endpointGroups.map((group) => (
                        <Card key={group.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            {group.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {group.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(group)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteGroup(group.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Hash className="h-3 w-3 text-gray-400" />
                                        <span className="text-gray-500">Group ID:</span>
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                            {group.id}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 p-0 hover:bg-gray-200"
                                                onClick={() => copyToClipboard(group.id, `group-${group.id}`)}
                                            >
                                                {copiedId === `group-${group.id}` ? (
                                                    <Check className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={group.enabled ? "default" : "secondary"}>
                                                {group.enabled ? "Enabled" : "Disabled"}
                                            </Badge>
                                            <Badge variant="outline">
                                                {group.endpointIds.length} endpoint{group.endpointIds.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleGroup(group.id, !group.enabled)}
                                        >
                                            {group.enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    {group.endpointIds.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Endpoints</h4>
                                            <div className="space-y-1">
                                                {group.endpointIds.slice(0, 3).map((endpointId) => (
                                                    <div key={endpointId} className="flex items-center gap-2 text-sm">
                                                        <Globe className="h-3 w-3 text-gray-400" />
                                                        <span className="truncate">{getEndpointName(endpointId)}</span>
                                                    </div>
                                                ))}
                                                {group.endpointIds.length > 3 && (
                                                    <div className="text-xs text-gray-500">
                                                        +{group.endpointIds.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
