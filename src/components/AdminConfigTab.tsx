"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Save, 
  RefreshCw, 
  Database, 
  AlertTriangle,
  CheckCircle,
  Settings,
} from "lucide-react";

interface ServerConfig {
  id: string;
  cloudflareApiKey?: string;
  cloudflareAccountId?: string;
  logRetentionDays: number;
  payloadRetentionDays: number;
  defaultMaxRetries: number;
  defaultTimeoutMs: number;
  defaultBackoffStrategy: string;
  queueManagementEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminConfigTab() {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    cloudflareApiKey: "",
    cloudflareAccountId: "",
    logRetentionDays: 30,
    payloadRetentionDays: 7,
    defaultMaxRetries: 3,
    defaultTimeoutMs: 30000,
    defaultBackoffStrategy: "exponential",
    queueManagementEnabled: false,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/config");
      if (!response.ok) {
        if (response.status === 404) {
          // No config exists yet, use defaults
          setConfig(null);
        } else {
          throw new Error("Failed to fetch server configuration");
        }
      } else {
        const data = await response.json() as { config: ServerConfig };
        setConfig(data.config);
        setFormData({
          cloudflareApiKey: data.config.cloudflareApiKey || "",
          cloudflareAccountId: data.config.cloudflareAccountId || "",
          logRetentionDays: data.config.logRetentionDays || 30,
          payloadRetentionDays: data.config.payloadRetentionDays || 7,
          defaultMaxRetries: data.config.defaultMaxRetries || 3,
          defaultTimeoutMs: data.config.defaultTimeoutMs || 30000,
          defaultBackoffStrategy: data.config.defaultBackoffStrategy || "exponential",
          queueManagementEnabled: data.config.queueManagementEnabled || false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save server configuration");
      }

      const updatedConfig = await response.json() as { config: ServerConfig };
      setConfig(updatedConfig.config);
      setSuccess("Server configuration saved successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading server configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center space-x-2 p-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </CardContent>
        </Card>
      )}

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Default Settings</CardTitle>
          </div>
          <CardDescription>
            Set default values for new endpoints and webhook configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultMaxRetries" className="mb-2">Default Max Retries</Label>
              <Input
                id="defaultMaxRetries"
                type="number"
                value={formData.defaultMaxRetries}
                onChange={(e) => setFormData({ ...formData, defaultMaxRetries: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="defaultTimeoutMs" className="mb-2">Default Timeout (ms)</Label>
              <Input
                id="defaultTimeoutMs"
                type="number"
                value={formData.defaultTimeoutMs}
                onChange={(e) => setFormData({ ...formData, defaultTimeoutMs: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="defaultBackoffStrategy" className="mb-2">Default Backoff Strategy</Label>
            <Select 
              value={formData.defaultBackoffStrategy} 
              onValueChange={(value) => setFormData({ ...formData, defaultBackoffStrategy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-purple-600" />
            <CardTitle>Data Retention</CardTitle>
          </div>
          <CardDescription>
            Configure how long to retain logs and payloads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logRetentionDays" className="mb-2">Log Retention (days)</Label>
              <Input
                id="logRetentionDays"
                type="number"
                value={formData.logRetentionDays}
                onChange={(e) => setFormData({ ...formData, logRetentionDays: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                How long to keep webhook delivery logs
              </p>
            </div>
            <div>
              <Label htmlFor="payloadRetentionDays" className="mb-2">Payload Retention (days)</Label>
              <Input
                id="payloadRetentionDays"
                type="number"
                value={formData.payloadRetentionDays}
                onChange={(e) => setFormData({ ...formData, payloadRetentionDays: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                How long to keep webhook payloads
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
