"use client";

import { Globe, Users, Zap } from "lucide-react";
import EndpointsTab from "@/components/EndpointsTab";
import EndpointGroupsTab from "@/components/EndpointGroupsTab";
import EventTypesTab from "@/components/EventTypesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WebhooksPage() {
  return (
    <Tabs defaultValue="endpoints">
      <TabsList className="mb-2 rounded-none">
        <TabsTrigger value="endpoints"><Globe className="h-4 w-4" /> Endpoints</TabsTrigger>
        <TabsTrigger value="endpoint-groups"><Users className="h-4 w-4" /> Endpoint Groups</TabsTrigger>
        <TabsTrigger value="event-types"><Zap className="h-4 w-4" /> Event Types</TabsTrigger>
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
