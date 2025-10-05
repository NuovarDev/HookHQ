"use client";

import { Settings, Users, Globe } from "lucide-react";
import AdminConfigTab from "@/components/AdminConfigTab";
import AdminUsersTab from "@/components/AdminUsersTab";
import AdminEnvironmentsTab from "@/components/AdminEnvironmentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  return (
    <Tabs defaultValue="config">
      <TabsList className="mb-2 rounded-none w-full">
        <TabsTrigger value="config" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Settings className="h-4 w-4" /> Server Config</TabsTrigger>
        <TabsTrigger value="users" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Users className="h-4 w-4" /> User Management</TabsTrigger>
        <TabsTrigger value="environments" className="rounded-none dark:data-[state=active]:bg-neutral-700/50"><Globe className="h-4 w-4" /> Environments</TabsTrigger>
      </TabsList>
      <TabsContent value="config">
        <AdminConfigTab />
      </TabsContent>
      <TabsContent value="users">
        <AdminUsersTab />
      </TabsContent>
      <TabsContent value="environments">
        <AdminEnvironmentsTab />
        </TabsContent>
    </Tabs>
  );
}
