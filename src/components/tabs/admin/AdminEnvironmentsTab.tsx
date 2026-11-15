"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Trash2, AlertTriangle, Calendar, Copy, Shield } from "lucide-react";
import { useEnvironment, Environment } from "@/components/providers/EnvironmentProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { publicApiFetch } from "@/lib/publicApi/utils";

type CloneOptions = {
  endpoints: boolean;
  endpointGroups: boolean;
  eventTypes: boolean;
  proxyServers: boolean;
  proxyGroups: boolean;
};

const defaultCloneOptions: CloneOptions = {
  endpoints: true,
  endpointGroups: true,
  eventTypes: true,
  proxyServers: true,
  proxyGroups: true,
};

export default function AdminEnvironmentsTab() {
  const { environments, loading, refreshEnvironments } = useEnvironment();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [environmentToDelete, setEnvironmentToDelete] = useState<Environment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [environmentToClone, setEnvironmentToClone] = useState<Environment | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [cloneOptions, setCloneOptions] = useState<CloneOptions>(defaultCloneOptions);
  const [isCloning, setIsCloning] = useState(false);

  const handleDeleteClick = (environment: Environment) => {
    setEnvironmentToDelete(environment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!environmentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await publicApiFetch(`/environments/${environmentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete environment");
      }

      // Refresh the environments list
      await refreshEnvironments();
      setDeleteDialogOpen(false);
      setEnvironmentToDelete(null);
    } catch (error) {
      console.error("Failed to delete environment:", error);
      alert("Failed to delete environment. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEnvironmentToDelete(null);
  };

  const handleCloneClick = (environment: Environment) => {
    setEnvironmentToClone(environment);
    setCloneName(`${environment.name} Copy`);
    setCloneDescription(environment.description || "");
    setCloneOptions(defaultCloneOptions);
  };

  const handleCloneCancel = () => {
    setEnvironmentToClone(null);
    setCloneName("");
    setCloneDescription("");
    setCloneOptions(defaultCloneOptions);
  };

  const handleCloneConfirm = async () => {
    if (!environmentToClone || !cloneName.trim()) return;

    setIsCloning(true);
    try {
      const response = await publicApiFetch(`/environments/${environmentToClone.id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cloneName.trim(),
          description: cloneDescription.trim() || undefined,
          copy: cloneOptions,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(error?.message || error?.error || "Failed to clone environment");
      }

      await refreshEnvironments();
      handleCloneCancel();
    } catch (error) {
      console.error("Failed to clone environment:", error);
      alert(error instanceof Error ? error.message : "Failed to clone environment. Please try again.");
    } finally {
      setIsCloning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-gray-600">Loading environments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Environment Management
          </CardTitle>
          <CardDescription>
            Manage and delete environments. Be careful when deleting environments as this action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {environments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No environments found.</div>
            ) : (
              <div className="grid gap-4">
                {environments.map(environment => (
                  <div
                    key={environment.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Globe className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-foreground truncate">{environment.name}</h3>
                          {environment.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        {environment.description && (
                          <p className="text-sm text-muted-foreground mt-1">{environment.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created {new Date(environment.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleCloneClick(environment)}>
                        <Copy className="mr-1 h-4 w-4" />
                        Clone
                      </Button>
                      {environment.isDefault ? (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Shield className="h-3 w-3" />
                          <span>Protected</span>
                        </div>
                      ) : (
                        <Dialog
                          open={deleteDialogOpen && environmentToDelete?.id === environment.id}
                          onOpenChange={setDeleteDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(environment)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Delete Environment
                              </DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete the environment "{environment.name}"? This action cannot
                                be undone and will permanently remove all associated data.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-4">
                                <div className="flex">
                                  <AlertTriangle className="h-5 w-5 text-red-400" />
                                  <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                      Warning: This action is irreversible
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                                      <ul className="list-disc list-inside space-y-1">
                                        <li>All webhook endpoints in this environment will be deleted</li>
                                        <li>All API keys in this environment will be deleted</li>
                                        <li>All webhook messages and logs will be deleted</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={handleDeleteCancel}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete Environment"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={environmentToClone !== null} onOpenChange={open => !open && handleCloneCancel()}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Clone Environment
                </DialogTitle>
                <DialogDescription>
                  Choose the resources to copy from {environmentToClone?.name}. Delivery logs, attempts, and event
                  history are never copied.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="clone-environment-name">New environment name *</Label>
                  <Input
                    id="clone-environment-name"
                    value={cloneName}
                    onChange={event => setCloneName(event.target.value)}
                    placeholder="Production Copy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clone-environment-description">Description</Label>
                  <Input
                    id="clone-environment-description"
                    value={cloneDescription}
                    onChange={event => setCloneDescription(event.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Copy resources</Label>
                  <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
                    {(
                      [
                        ["endpoints", "Endpoints"],
                        ["endpointGroups", "Endpoint groups"],
                        ["eventTypes", "Event types"],
                        ["proxyServers", "Proxy servers"],
                        ["proxyGroups", "Proxy groups"],
                      ] as Array<[keyof CloneOptions, string]>
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 text-sm font-medium">
                        <Checkbox
                          checked={cloneOptions[key]}
                          onCheckedChange={checked =>
                            setCloneOptions(current => ({ ...current, [key]: checked === true }))
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    References between copied resources are updated for the new environment. References to resources you
                    do not copy are removed.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloneCancel} disabled={isCloning}>
                  Cancel
                </Button>
                <Button onClick={handleCloneConfirm} disabled={isCloning || !cloneName.trim()}>
                  {isCloning ? "Cloning..." : "Clone Environment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
