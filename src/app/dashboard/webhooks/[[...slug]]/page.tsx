"use client";

import { Globe, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EndpointsTab from "@/components/tabs/endpoints/EndpointsTab";
import EndpointGroupsTab from "@/components/tabs/endpoints/EndpointGroupsTab";
import EventTypesTab from "@/components/tabs/endpoints/EventTypesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WebhooksPageProps {
  params: Promise<{ slug?: string[] }>;
}

export default function WebhooksPage({ params }: WebhooksPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ slug?: string[] }>({});

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Determine active tab from URL slug
  const activeTab = resolvedParams.slug?.[0] || "endpoints";

  // Local state for tab management
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Sync local state with URL when params resolve
  useEffect(() => {
    if (resolvedParams.slug) {
      setCurrentTab(resolvedParams.slug[0] || "endpoints");
    }
  }, [resolvedParams.slug]);

  const handleTabChange = (value: string) => {
    // Update local state immediately for instant UI response
    setCurrentTab(value);
    // Update URL without causing a full page reload
    const newUrl = `/dashboard/webhooks/${value}`;
    window.history.pushState(null, "", newUrl);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList className="mb-2 rounded-none w-full">
        <TabsTrigger value="endpoints" className="rounded-none dark:data-[state=active]:bg-neutral-700/50">
          <Globe className="h-4 w-4" /> Endpoints
        </TabsTrigger>
        <TabsTrigger value="endpoint-groups" className="rounded-none dark:data-[state=active]:bg-neutral-700/50">
          <Users className="h-4 w-4" /> Endpoint Groups
        </TabsTrigger>
        <TabsTrigger value="event-types" className="rounded-none dark:data-[state=active]:bg-neutral-700/50">
          <Zap className="h-4 w-4" /> Event Types
        </TabsTrigger>
      </TabsList>
      <TabsContent value="endpoints">
        <EndpointsTab />
      </TabsContent>
      <TabsContent value="endpoint-groups">
        <EndpointGroupsTab />
      </TabsContent>
      <TabsContent value="event-types">
        <EventTypesTab />
      </TabsContent>
    </Tabs>
  );
}
