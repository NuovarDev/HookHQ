"use client";

import { useState } from "react";
import { Server, Users } from "lucide-react";
import ProxyServersTab from "@/components/ProxyServersTab";
import ProxyGroupsTab from "@/components/ProxyGroupsTab";

type TabType = "servers" | "groups";

export default function ProxyPage() {
  const [activeTab, setActiveTab] = useState<TabType>("servers");

  const tabs = [
    {
      id: "servers" as TabType,
      name: "Proxy Servers",
      icon: Server,
      description: "Manage proxy servers with static IPs"
    },
    {
      id: "groups" as TabType,
      name: "Proxy Groups", 
      icon: Users,
      description: "Group proxy servers for load balancing"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "servers" && <ProxyServersTab />}
        {activeTab === "groups" && <ProxyGroupsTab />}
      </div>
    </div>
  );
}
