"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, Settings, Tag } from "lucide-react";
import EnvironmentGate from "@/components/EnvironmentGate";
import EndpointsTab from "@/components/EndpointsTab";
import EndpointGroupsTab from "@/components/EndpointGroupsTab";
import EventTypesTab from "@/components/EventTypesTab";

type TabType = "endpoints" | "endpoint-groups" | "event-types";

export default function WebhooksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("endpoints");

  const tabs = [
    {
      id: "endpoints" as TabType,
      name: "Endpoints",
      icon: Globe,
      description: "Manage individual webhook endpoints"
    },
    {
      id: "endpoint-groups" as TabType,
      name: "Endpoint Groups", 
      icon: Users,
      description: "Group endpoints for batch operations"
    },
    {
      id: "event-types" as TabType,
      name: "Event Types",
      icon: Tag,
      description: "Define event types for webhook categorization"
    }
  ];

  return (
    <EnvironmentGate>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-muted-foreground">
            Manage your webhook endpoints and endpoint groups
          </p>
        </div>

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
          {activeTab === "endpoints" && <EndpointsTab />}
          {activeTab === "endpoint-groups" && <EndpointGroupsTab />}
          {activeTab === "event-types" && <EventTypesTab />}
        </div>
      </div>
    </EnvironmentGate>
  );
}
