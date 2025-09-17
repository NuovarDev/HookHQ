"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe } from "lucide-react";
import { useState } from "react";
import { useEnvironment, Environment } from "./EnvironmentProvider";

interface EnvironmentSwitcherProps {
    selectedEnvironment: Environment | null;
    onEnvironmentChange: (environment: Environment) => void;
    onCreateEnvironment: (name: string, description?: string) => Promise<void>;
}

export default function EnvironmentSwitcher({ 
    selectedEnvironment, 
    onEnvironmentChange, 
    onCreateEnvironment 
}: EnvironmentSwitcherProps) {
    const { environments, loading, setSelectedEnvironment } = useEnvironment();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newEnvName, setNewEnvName] = useState("");
    const [newEnvDescription, setNewEnvDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateEnvironment = async () => {
        if (!newEnvName.trim()) return;
        
        setIsCreating(true);
        try {
            await onCreateEnvironment(newEnvName.trim(), newEnvDescription.trim() || undefined);
            setNewEnvName("");
            setNewEnvDescription("");
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.error("Failed to create environment:", error);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-4">
                    <div className="text-gray-600">Loading environments...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Environment
                </CardTitle>
                <CardDescription>
                    Select the environment for your API keys and endpoints
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Current Environment</Label>
                    <Select
                        value={selectedEnvironment?.id || ""}
                        onValueChange={async (value) => {
                            const env = environments.find(e => e.id === value);
                            if (env) {
                                await setSelectedEnvironment(env);
                                onEnvironmentChange(env);
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                            {environments.map((env) => (
                                <SelectItem key={env.id} value={env.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{env.name}</span>
                                        {env.isDefault && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedEnvironment && (
                    <div className="p-3 bg-gray-50 rounded-md">
                        <div className="text-sm">
                            <div className="font-medium">{selectedEnvironment.name}</div>
                            {selectedEnvironment.description && (
                                <div className="text-gray-600">{selectedEnvironment.description}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                                Created {new Date(selectedEnvironment.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                )}

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Environment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Environment</DialogTitle>
                            <DialogDescription>
                                Create a new environment for organizing your API keys and endpoints.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="env-name">Environment Name</Label>
                                <Input
                                    id="env-name"
                                    placeholder="e.g., Development, Staging, Production"
                                    value={newEnvName}
                                    onChange={(e) => setNewEnvName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="env-description">Description (Optional)</Label>
                                <Input
                                    id="env-description"
                                    placeholder="Brief description of this environment"
                                    value={newEnvDescription}
                                    onChange={(e) => setNewEnvDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleCreateEnvironment} 
                                disabled={!newEnvName.trim() || isCreating}
                            >
                                {isCreating ? "Creating..." : "Create Environment"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
