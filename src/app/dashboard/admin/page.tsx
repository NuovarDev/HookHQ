"use client";

import { Settings, Users, Globe } from "lucide-react";
import AdminConfigTab from "@/components/AdminConfigTab";
import AdminUsersTab from "@/components/AdminUsersTab";
import AdminEnvironmentsTab from "@/components/AdminEnvironmentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  return (
    <Tabs defaultValue="config">
      <TabsList className="mb-2 rounded-none">
        <TabsTrigger value="config"><Settings className="h-4 w-4" /> Server Config</TabsTrigger>
        <TabsTrigger value="users"><Users className="h-4 w-4" /> User Management</TabsTrigger>
        <TabsTrigger value="environments"><Globe className="h-4 w-4" /> Environments</TabsTrigger>
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
