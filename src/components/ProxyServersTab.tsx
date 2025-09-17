"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Plus, RefreshCw, Server, Globe, Shield, Clock, Users, LoaderCircle } from "lucide-react";

interface ProxyServer {
  id: string;
  environmentId: string;
  name: string;
  description?: string;
  url: string;
  isActive: boolean;
  region?: string;
  provider?: string;
  staticIp?: string;
  healthCheckUrl?: string;
  timeoutMs: number;
  maxConcurrentRequests: number;
  createdAt: string;
  updatedAt: string;
}

interface ProxyServerCreateResponse {
  id: string;
  environmentId: string;
  name: string;
  description?: string;
  url: string;
  region?: string;
  provider?: string;
  staticIp?: string;
  healthCheckUrl?: string;
  timeoutMs: number;
  maxConcurrentRequests: number;
  secret: string;
  configInstructions: {
    docker: { command: string; env: string };
    gcp: { env: string; command: string };
    aws: { env: string; command: string };
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProxyServersTab() {
  const [proxyServers, setProxyServers] = useState<ProxyServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [newProxySecret, setNewProxySecret] = useState("");
  const [newProxyConfig, setNewProxyConfig] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    region: "",
    provider: "",
    staticIp: "",
    healthCheckUrl: "",
    timeoutMs: 30000,
    maxConcurrentRequests: 100,
  });

  useEffect(() => {
    fetchProxyServers();
  }, []);

  const fetchProxyServers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/proxy-servers");
      if (!response.ok) throw new Error("Failed to fetch proxy servers");
      
      const data = await response.json() as { proxyServers: ProxyServer[] };
      setProxyServers(data.proxyServers || []);
    } catch (error) {
      console.error("Error fetching proxy servers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProxy = async () => {
    try {
      setCreating(true);
      const response = await fetch("/api/proxy-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create proxy server");
      
      const newProxy: ProxyServerCreateResponse = await response.json();
      
      // Show secret and config instructions
      setNewProxySecret(newProxy.secret);
      setNewProxyConfig(newProxy.configInstructions);
      setShowSecretDialog(true);
      
      // Reset form and refresh list
      setFormData({
        name: "",
        description: "",
        url: "",
        region: "",
        provider: "",
        staticIp: "",
        healthCheckUrl: "",
        timeoutMs: 30000,
        maxConcurrentRequests: 100,
      });
      setShowCreateDialog(false);
      fetchProxyServers();
    } catch (error) {
      console.error("Error creating proxy server:", error);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case "aws": return "☁️";
      case "gcp": return "🌐";
      case "azure": return "🔷";
      default: return "🖥️";
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proxy Servers</h2>
          <p className="text-muted-foreground">
            Manage proxy servers for webhook delivery with static IPs
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Proxy Server
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Proxy Server</DialogTitle>
              <DialogDescription>
                Add a new proxy server for webhook delivery with static IP support.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="US-East Proxy"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://proxy-us-east.example.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Proxy server for US East region webhook delivery"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">AWS</SelectItem>
                      <SelectItem value="gcp">Google Cloud</SelectItem>
                      <SelectItem value="azure">Azure</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="us-east-1"
                  />
                </div>
                <div>
                  <Label htmlFor="staticIp">Static IP</Label>
                  <Input
                    id="staticIp"
                    value={formData.staticIp}
                    onChange={(e) => setFormData({ ...formData, staticIp: e.target.value })}
                    placeholder="203.0.113.1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="healthCheckUrl">Health Check URL</Label>
                <Input
                  id="healthCheckUrl"
                  value={formData.healthCheckUrl}
                  onChange={(e) => setFormData({ ...formData, healthCheckUrl: e.target.value })}
                  placeholder="https://proxy-us-east.example.com/health"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeoutMs">Timeout (ms)</Label>
                  <Input
                    id="timeoutMs"
                    type="number"
                    value={formData.timeoutMs}
                    onChange={(e) => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxConcurrentRequests">Max Concurrent Requests</Label>
                  <Input
                    id="maxConcurrentRequests"
                    type="number"
                    value={formData.maxConcurrentRequests}
                    onChange={(e) => setFormData({ ...formData, maxConcurrentRequests: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProxy} disabled={creating || !formData.name || !formData.url}>
                  {creating ? "Creating..." : "Create Proxy Server"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LoaderCircle className="h-12 w-12 mb-4 animate-spin text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Loading...</h3>
            </CardContent>
        </Card>
      )}

      {!loading && proxyServers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No proxy servers</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first proxy server to enable static IP webhook delivery.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Proxy Server
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proxyServers.map((proxy) => (
            <Card key={proxy.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getProviderIcon(proxy.provider)}</span>
                    <div>
                      <CardTitle className="text-lg">{proxy.name}</CardTitle>
                      <CardDescription>{proxy.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(proxy.isActive)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">URL</div>
                      <div className="text-muted-foreground truncate">{proxy.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Region</div>
                      <div className="text-muted-foreground">{proxy.region || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Timeout</div>
                      <div className="text-muted-foreground">{proxy.timeoutMs}ms</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Max Concurrent</div>
                      <div className="text-muted-foreground">{proxy.maxConcurrentRequests}</div>
                    </div>
                  </div>
                </div>
                {proxy.staticIp && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Static IP</div>
                        <div className="text-muted-foreground font-mono">{proxy.staticIp}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(proxy.staticIp!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Secret Display Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proxy Server Created Successfully!</DialogTitle>
            <DialogDescription>
              Your proxy server has been created. Save the secret and configuration instructions below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Important: Save Your Secret</span>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                This secret will only be shown once. Copy it now and store it securely.
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-white border rounded font-mono text-sm">
                  {newProxySecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newProxySecret)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {newProxyConfig && (
              <div className="space-y-4">
                <h4 className="font-semibold">Deployment Instructions</h4>
                
                <div>
                  <h5 className="font-medium mb-2">Docker</h5>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm">{newProxyConfig.docker.command}</code>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Google Cloud Run</h5>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm">{newProxyConfig.gcp.command}</code>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">AWS ECS</h5>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm">{newProxyConfig.aws.command}</code>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowSecretDialog(false)}>
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
