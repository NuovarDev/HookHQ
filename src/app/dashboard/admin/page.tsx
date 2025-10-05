"use client";

import { Settings, Users, Globe, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminConfigTab from "@/components/AdminConfigTab";
import AdminUsersTab from "@/components/AdminUsersTab";
import AdminEnvironmentsTab from "@/components/AdminEnvironmentsTab";
import QueueMetricsTab from "@/components/QueueMetricsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ServerConfig {
  cloudflareApiKey: string | null;
  cloudflareAccountId: string | null;
  cloudflareQueueId: string | null;
}

export default function AdminPage() {
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json() as { config: ServerConfig };
        setServerConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if Cloudflare config is complete
  const hasCloudflareConfig = serverConfig && 
    serverConfig.cloudflareApiKey && 
    serverConfig.cloudflareAccountId && 
    serverConfig.cloudflareQueueId;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Tabs defaultValue="config">
      <TabsList className="mb-2 rounded-none w-full">
        <TabsTrigger value="config" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Settings className="h-4 w-4" /> Server Config</TabsTrigger>
        {hasCloudflareConfig && (
          <TabsTrigger value="metrics" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><BarChart3 className="h-4 w-4" /> Queue Metrics</TabsTrigger>
        )}
        <TabsTrigger value="users" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Users className="h-4 w-4" /> User Management</TabsTrigger>
        <TabsTrigger value="environments" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Globe className="h-4 w-4" /> Environments</TabsTrigger>
      </TabsList>
      <TabsContent value="config">
        <AdminConfigTab onConfigUpdate={fetchConfig} />
      </TabsContent>
      {hasCloudflareConfig && (
        <TabsContent value="metrics">
          <QueueMetricsTab />
        </TabsContent>
      )}
      <TabsContent value="users">
        <AdminUsersTab />
      </TabsContent>
      <TabsContent value="environments">
        <AdminEnvironmentsTab />
        </TabsContent>
    </Tabs>
  );
}
