"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, User, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
    });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = () => {
        if (!formData.email || !formData.name || !formData.password) {
            setError("All fields are required");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        return true;
    };

    const handleCreateAdmin = async () => {
        if (!validateForm()) return;

        setIsCreating(true);
        setError(null);

        try {
            const response = await fetch("/api/setup/create-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const data = await response.json() as { error: string };
                throw new Error(data.error || "Failed to create admin user");
            }

            setSuccess("Admin user created successfully!");
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create admin user");
        } finally {
            setIsCreating(false);
        }
    };

    const handleComplete = () => {
        router.push("/dashboard");
    };

    if (step === 1) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-3xl">Welcome to Webhooks</CardTitle>
                        <CardDescription className="text-lg">
                            Let's set up your admin account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center text-gray-600">
                            <p>This appears to be your first time setting up the system.</p>
                            <p className="mt-2">We'll create an admin account for you to get started.</p>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Create admin user account</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Set up default environment</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Generate initial API key</span>
                            </div>
                        </div>

                        <Button onClick={() => setStep(2)} className="w-full" size="lg">
                            Get Started
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center space-x-2">
                            <User className="h-6 w-6" />
                            <span>Create Admin Account</span>
                        </CardTitle>
                        <CardDescription>
                            Set up your administrator account to manage the system
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a secure password"
                                value={formData.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setStep(1)}
                                className="flex-1"
                                disabled={isCreating}
                            >
                                Back
                            </Button>
                            <Button 
                                onClick={handleCreateAdmin}
                                disabled={isCreating || !formData.email || !formData.name || !formData.password || !formData.confirmPassword}
                                className="flex-1"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Admin"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl">Setup Complete!</CardTitle>
                        <CardDescription className="text-lg">
                            Your admin account has been created successfully
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center text-gray-600">
                            <p>You can now:</p>
                            <ul className="mt-3 space-y-2 text-left">
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Access the admin panel</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Create additional users</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Configure server settings</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span>Manage webhooks and API keys</span>
                                </li>
                            </ul>
                        </div>

                        <Button onClick={handleComplete} className="w-full" size="lg">
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
