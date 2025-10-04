"use client";

import { useEnvironment } from "./EnvironmentProvider";
import OnboardingFlow from "./OnboardingFlow";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EnvironmentGateProps {
    children: React.ReactNode;
}

export default function EnvironmentGate({ children }: EnvironmentGateProps) {
    const { loading, hasEnvironments, environmentError, environments, setSelectedEnvironment, refreshEnvironments } = useEnvironment();

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

    // Show environment error if current environment doesn't exist
    if (environmentError) {
        const handleEnvironmentChange = async (environmentId: string) => {
            const selectedEnv = environments.find(env => env.id === environmentId);
            if (selectedEnv) {
                await setSelectedEnvironment(selectedEnv);
                // Refresh the page to reload with the new environment
                window.location.reload();
            }
        };

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="max-w-md mx-auto text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-red-800 mb-2">Environment Not Found</h3>
                        <p className="text-red-700 mb-4">{environmentError}</p>
                        
                        {environments.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-red-800 mb-2">
                                    Select a valid environment:
                                </label>
                                <Select onValueChange={handleEnvironmentChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose an environment..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {environments.map((env) => (
                                            <SelectItem key={env.id} value={env.id}>
                                                {env.name}
                                                {env.isDefault && " (Default)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="flex gap-2 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                                Refresh Page
                            </Button>
                            {environments.length === 0 && (
                                <Button
                                    onClick={() => window.location.href = '/setup'}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                >
                                    Create Environment
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
