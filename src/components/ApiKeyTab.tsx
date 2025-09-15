"use client";

import ApiKeyManager from "./ApiKeyManager";
import { useState, useEffect } from "react";
import { ApiKeyPermission } from "@/lib/apiKeys";

interface ApiKey {
    id: string;
    name: string;
    key: string | undefined | null;
    start?: string; // First few characters of the key from Better Auth
    permissions: ApiKeyPermission[];
    enabled: boolean;
    createdAt: string;
    lastUsed?: string;
    lastRequest?: string; // Last request date from Better Auth
    showRawKey?: boolean; // Only true immediately after creation
}

export default function ApiKeyTab() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApiKeys = async () => {
        try {
            const response = await fetch("/api/api-keys");
            if (!response.ok) {
                throw new Error("Failed to fetch API keys");
            }
            const data = await response.json();
            setApiKeys((data as { apiKeys: ApiKey[] }).apiKeys);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const handleCreateKey = async (name: string, permissions: ApiKeyPermission[], environment: string) => {
        try {
            const response = await fetch("/api/api-keys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, permissions, environment }),
            });

            if (!response.ok) {
                throw new Error("Failed to create API key");
            }

            const newKeyData = await response.json() as { id: string; name: string; key: string; permissions: ApiKeyPermission[]; enabled: boolean; createdAt: string };
            // Mark the new key to show raw key with warning
            const keyWithRawFlag: ApiKey = { ...newKeyData, showRawKey: true };
            setApiKeys(prev => [...prev, keyWithRawFlag]);
            
            // Auto-dismiss the warning after 30 seconds
            setTimeout(() => {
                handleDismissRawKey(newKeyData.id);
            }, 30000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create API key");
            throw err;
        }
    };

    const handleDeleteKey = async (id: string) => {
        try {
            const response = await fetch(`/api/api-keys/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete API key");
            }

            setApiKeys(prev => prev.filter(key => key.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete API key");
            throw err;
        }
    };

    const handleToggleKey = async (id: string, enabled: boolean) => {
        try {
            const response = await fetch(`/api/api-keys/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ enabled }),
            });

            if (!response.ok) {
                throw new Error("Failed to update API key");
            }

            setApiKeys(prev => 
                prev.map(key => 
                    key.id === id ? { ...key, enabled } : key
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update API key");
            throw err;
        }
    };

    const handleDismissRawKey = (id: string) => {
        setApiKeys(prev => 
            prev.map(key => 
                key.id === id ? { ...key, showRawKey: false } : key
            )
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="text-gray-600">Loading API keys...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <ApiKeyManager
            apiKeys={apiKeys}
            onCreateKey={handleCreateKey}
            onDeleteKey={handleDeleteKey}
            onToggleKey={handleToggleKey}
            onDismissRawKey={handleDismissRawKey}
        />
    );
}
