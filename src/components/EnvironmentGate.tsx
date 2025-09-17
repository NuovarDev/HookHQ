"use client";

import { useEnvironment } from "./EnvironmentProvider";
import OnboardingFlow from "./OnboardingFlow";

interface EnvironmentGateProps {
    children: React.ReactNode;
}

export default function EnvironmentGate({ children }: EnvironmentGateProps) {
    const { loading, hasEnvironments, refreshEnvironments } = useEnvironment();

    const handleOnboardingComplete = () => {
        // Refresh environments to pick up the newly created one
        refreshEnvironments();
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
