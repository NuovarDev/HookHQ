"use client";

import { Server, Users } from "lucide-react";
import ProxyServersTab from "@/components/ProxyServersTab";
import ProxyGroupsTab from "@/components/ProxyGroupsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProxyPage() {
  return (
    <Tabs defaultValue="proxy-servers">
      <TabsList className="mb-2 rounded-none w-full">
        <TabsTrigger value="proxy-servers" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Server className="h-4 w-4" /> Proxy Servers</TabsTrigger>
        <TabsTrigger value="proxy-groups" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Users className="h-4 w-4" /> Proxy Groups</TabsTrigger>
      </TabsList>
      <TabsContent value="proxy-servers">
        <ProxyServersTab />
      </TabsContent>
      <TabsContent value="proxy-groups">
        <ProxyGroupsTab />
      </TabsContent>
    </Tabs>
  );
}
