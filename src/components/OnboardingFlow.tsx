"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, ArrowRight, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserLastEnvironment } from "@/lib/environmentState";

interface OnboardingFlowProps {
    onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState(1);
    const [envName, setEnvName] = useState("");
    const [envDescription, setEnvDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleCreateEnvironment = async () => {
        if (!envName.trim()) {
            setError("Environment name is required");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const response = await fetch("/api/environments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: envName.trim(),
                    description: envDescription.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json() as { error: string };
                throw new Error(data.error || "Failed to create environment");
            }

            const newEnv = await response.json() as { id: string; name: string };
            console.log("Environment created:", newEnv);
            
            // Set this as the user's last environment
            await updateUserLastEnvironment(newEnv.id);
            
            setStep(3); // Move to completion step
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create environment");
        } finally {
            setIsCreating(false);
        }
    };

    const handleComplete = () => {
        onComplete();
        router.refresh();
    };

    if (step === 1) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Globe className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl">Welcome to Webhooks!</CardTitle>
                        <CardDescription>
                            Let's set up your first environment to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-sm text-gray-600">
                            <p>Environments help you organize your webhooks and API keys.</p>
                            <p className="mt-2">You'll create your first environment now.</p>
                        </div>
                        <Button onClick={() => setStep(2)} className="w-full">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Create Your First Environment</CardTitle>
                        <CardDescription>
                            Choose a name for your environment (e.g., Production, Development)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="env-name">Environment Name</Label>
                            <Input
                                id="env-name"
                                placeholder="e.g., Production, Development, Staging"
                                value={envName}
                                onChange={(e) => setEnvName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="env-description">Description (Optional)</Label>
                            <Input
                                id="env-description"
                                placeholder="Brief description of this environment"
                                value={envDescription}
                                onChange={(e) => setEnvDescription(e.target.value)}
                            />
                        </div>
                        
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setStep(1)}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button 
                                onClick={handleCreateEnvironment}
                                disabled={!envName.trim() || isCreating}
                                className="flex-1"
                            >
                                {isCreating ? "Creating..." : "Create Environment"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">All Set!</CardTitle>
                        <CardDescription>
                            Your environment "{envName}" has been created successfully
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-sm text-gray-600">
                            <p>You can now:</p>
                            <ul className="mt-2 space-y-1 text-left">
                                <li>• Create API keys for your environment</li>
                                <li>• Set up webhook endpoints</li>
                                <li>• Manage your webhook configurations</li>
                            </ul>
                        </div>
                        <Button onClick={handleComplete} className="w-full">
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
