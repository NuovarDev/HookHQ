"use client";

import { useState } from "react";
import { Settings, Users, Globe } from "lucide-react";
import AdminConfigTab from "@/components/AdminConfigTab";
import AdminUsersTab from "@/components/AdminUsersTab";
import AdminEnvironmentsTab from "@/components/AdminEnvironmentsTab";

type TabType = "config" | "users" | "environments";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("config");

  const tabs = [
    {
      id: "config" as TabType,
      name: "Server Config",
      icon: Settings,
      description: "Configure server settings and defaults"
    },
    {
      id: "users" as TabType,
      name: "User Management",
      icon: Users,
      description: "Manage users and permissions"
    },
    {
      id: "environments" as TabType,
      name: "Environments",
      icon: Globe,
      description: "Manage and delete environments"
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
          {activeTab === "config" && <AdminConfigTab />}
          {activeTab === "users" && <AdminUsersTab />}
          {activeTab === "environments" && <AdminEnvironmentsTab />}
        </div>
      </div>
  );
}
