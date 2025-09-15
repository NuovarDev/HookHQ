"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Shield } from "lucide-react";
import EnvironmentGate from "@/components/EnvironmentGate";
import AdminConfigTab from "@/components/AdminConfigTab";
import AdminUsersTab from "@/components/AdminUsersTab";

type TabType = "config" | "users";

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
    }
  ];

  return (
    <EnvironmentGate>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="text-muted-foreground">
              Server configuration and user management
            </p>
          </div>
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
          {activeTab === "config" && <AdminConfigTab />}
          {activeTab === "users" && <AdminUsersTab />}
        </div>
      </div>
    </EnvironmentGate>
  );
}
