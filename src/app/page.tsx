"use client";

import authClient from "@/auth/authClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const { data: session, error: sessionError } = authClient.useSession();
    const [isAuthActionInProgress, setIsAuthActionInProgress] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
    const router = useRouter();

    // Check if setup is needed
    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                const response = await fetch("/api/setup/status");
                if (response.ok) {
                    const data = await response.json() as { needsSetup: boolean };
                    setNeedsSetup(data.needsSetup);
                    
                    if (data.needsSetup) {
                        router.push("/setup");
                    }
                }
            } catch (error) {
                console.error("Error checking setup status:", error);
            }
        };

        checkSetupStatus();
    }, [router]);

    const handleSignIn = async () => {
        if (isAuthActionInProgress || !email || !password) return;
        
        setIsAuthActionInProgress(true);
        setError(null);
        
        try {
            const result = await authClient.signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message ?? "Authentication failed");
            } else {
                // Login succeeded - middleware will handle redirect to dashboard
                window.location.reload();
            }
        } catch (e: any) {
            setError(`An unexpected error occurred: ${e.message}`);
        } finally {
            setIsAuthActionInProgress(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSignIn();
        }
    };


    if (sessionError) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Error loading session: {sessionError.message}</p>
            </div>
        );
    }

    // Show loading while checking setup status
    if (needsSetup === null) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="w-full max-w-md space-y-6">
                {/* Login Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Mail className="h-6 w-6" />
                            Sign In
                        </CardTitle>
                        <CardDescription>Access your webhook management dashboard</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button 
                            onClick={handleSignIn} 
                            className="w-full" 
                            disabled={isAuthActionInProgress || !email || !password}
                        >
                            {isAuthActionInProgress ? "Signing In..." : "Sign In"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <footer className="absolute bottom-0 w-full text-center text-sm text-gray-500 py-4">
                <div className="space-y-3">
                    <div>&copy; {new Date().getFullYear()} HookHQ</div>
                </div>
            </footer>
        </div>
    );
}
