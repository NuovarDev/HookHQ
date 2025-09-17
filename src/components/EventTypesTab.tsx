"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
    Plus, 
    Zap, 
    Edit,
    Trash2,
    Power,
    PowerOff,
    Code,
    LoaderCircle,
    CircleX
} from "lucide-react";
import { useState, useEffect } from "react";

interface EventType {
    id: string;
    environmentId: string;
    name: string;
    description?: string;
    schema?: any;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function EventTypesTab() {
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingEventType, setEditingEventType] = useState<EventType | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        schema: "",
        enabled: true
    });

    const fetchEventTypes = async () => {
        try {
            const response = await fetch("/api/event-types");
            if (!response.ok) {
                throw new Error("Failed to fetch event types");
            }
            const data = await response.json() as { eventTypes: EventType[] };
            setEventTypes(data.eventTypes);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventTypes();
    }, []);

    const handleCreateEventType = async () => {
        try {
            let schema = null;
            if (formData.schema.trim()) {
                try {
                    schema = JSON.parse(formData.schema);
                } catch (e) {
                    throw new Error("Invalid JSON schema");
                }
            }

            const response = await fetch("/api/event-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    schema
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create event type");
            }

            const newEventType = await response.json() as EventType;
            setEventTypes(prev => [...prev, newEventType]);
            setCreateDialogOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create event type");
        }
    };

    const handleToggleEventType = async (id: string, enabled: boolean) => {
        try {
            const response = await fetch(`/api/event-types/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled }),
            });

            if (!response.ok) {
                throw new Error("Failed to update event type");
            }

            setEventTypes(prev =>
                prev.map(eventType =>
                    eventType.id === id ? { ...eventType, enabled } : eventType
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update event type");
        }
    };

    const handleDeleteEventType = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event type?")) return;

        try {
            const response = await fetch(`/api/event-types/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete event type");
            }

            setEventTypes(prev => prev.filter(eventType => eventType.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete event type");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            schema: "",
            enabled: true
        });
    };

    const openEditDialog = (eventType: EventType) => {
        setFormData({
            name: eventType.name,
            description: eventType.description || "",
            schema: eventType.schema ? JSON.stringify(eventType.schema, null, 2) : "",
            enabled: eventType.enabled
        });
        setEditingEventType(eventType);
        setCreateDialogOpen(true);
    };

    const handleUpdateEventType = async () => {
        if (!editingEventType) return;

        try {
            let schema = null;
            if (formData.schema.trim()) {
                try {
                    schema = JSON.parse(formData.schema);
                } catch (e) {
                    throw new Error("Invalid JSON schema");
                }
            }

            const response = await fetch(`/api/event-types/${editingEventType.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    schema
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update event type");
            }

            const updatedEventType = await response.json() as EventType;
            setEventTypes(prev =>
                prev.map(eventType =>
                    eventType.id === editingEventType.id ? updatedEventType : eventType
                )
            );
            setCreateDialogOpen(false);
            setEditingEventType(null);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update event type");
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Event Types</h2>
                    <p className="text-gray-600">Define event schemas for structured webhook notifications</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Event Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingEventType ? "Edit Event Type" : "Create New Event Type"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingEventType 
                                    ? "Update your event type configuration"
                                    : "Define a new event type with its payload schema"
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
                                    placeholder="user.created"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Triggered when a new user is created"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schema">JSON Schema (Optional)</Label>
                                <textarea
                                    id="schema"
                                    className="w-full min-h-[200px] p-2 border rounded-md font-mono text-sm"
                                    value={formData.schema}
                                    onChange={(e) => setFormData(prev => ({ ...prev, schema: e.target.value }))}
                                    placeholder={`{
  "type": "object",
  "properties": {
    "userId": {
      "type": "string",
      "description": "The unique identifier of the user"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["userId", "email"]
}`}
                                />
                                <p className="text-xs text-gray-500">
                                    Define the structure of the event payload using JSON Schema
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={editingEventType ? handleUpdateEventType : handleCreateEventType}>
                                {editingEventType ? "Update" : "Create"} Event Type
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <LoaderCircle className="h-12 w-12 mb-4 animate-spin text-gray-400" />
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

            {!loading && !error && (eventTypes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Zap className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Event Types</h3>
                        <p className="text-gray-600 text-center">
                            Create your first event type to define structured webhook notifications.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventTypes.map((eventType) => (
                        <Card key={eventType.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            {eventType.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {eventType.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(eventType)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteEventType(eventType.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={eventType.enabled ? "default" : "secondary"}>
                                                {eventType.enabled ? "Enabled" : "Disabled"}
                                            </Badge>
                                            {eventType.schema && (
                                                <Badge variant="outline">
                                                    <Code className="h-3 w-3 mr-1" />
                                                    Schema
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleEventType(eventType.id, !eventType.enabled)}
                                        >
                                            {eventType.enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    {eventType.schema && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-1">Schema Preview</h4>
                                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono max-h-20 overflow-y-auto">
                                                {JSON.stringify(eventType.schema, null, 2).substring(0, 100)}
                                                {JSON.stringify(eventType.schema, null, 2).length > 100 && "..."}
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500">
                                        Created {new Date(eventType.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ))}
        </div>
    );
}
