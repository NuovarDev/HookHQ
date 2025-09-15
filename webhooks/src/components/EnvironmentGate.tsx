"use client";

import { useState, useEffect } from "react";
import OnboardingFlow from "./OnboardingFlow";

interface Environment {
    id: string;
    name: string;
    description?: string;
    isDefault: boolean;
    createdAt: string;
}

interface EnvironmentGateProps {
    children: React.ReactNode;
}

export default function EnvironmentGate({ children }: EnvironmentGateProps) {
    const [hasEnvironments, setHasEnvironments] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const checkEnvironments = async () => {
        try {
            const response = await fetch("/api/environments");
            if (!response.ok) {
                throw new Error("Failed to fetch environments");
            }
            const data = await response.json();
            setHasEnvironments(data.environments.length > 0);
        } catch (error) {
            console.error("Error checking environments:", error);
            setHasEnvironments(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkEnvironments();
    }, []);

    const handleOnboardingComplete = () => {
        setHasEnvironments(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!hasEnvironments) {
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    }

    return <>{children}</>;
}
