"use client";

import authClient from "@/auth/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Webhook, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"
import Image from "next/image";

export default function Home() {
    const { data: session, error: sessionError } = authClient.useSession();
    const [isAuthActionInProgress, setIsAuthActionInProgress] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
    const router = useRouter();

    const [isDark, setIsDark] = useState(false)

    const toggleTheme = () => {
        setIsDark(!isDark)
        document.documentElement.classList.toggle("dark")
    }

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
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className={isDark ? "dark" : ""}>
            <div className="min-h-screen bg-background flex items-center justify-center p-4 texture-overlay">
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="!absolute top-4 right-4 border-0">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                <div className="w-full max-w-md">
                    <div className="bg-card border border-border p-8">
                        <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 bg-black flex items-center justify-center dark:border-border dark:border">
                            <Image src="/logo.svg" alt="HookHQ" width={36} height={36} className="text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">HookHQ</h1>
                            <p className="text-sm text-muted-foreground">Developer Dashboard</p>
                        </div>
                        </div>

                        <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Sign in</h2>
                            <p className="text-sm text-muted-foreground">Enter your credentials to access your dashboard</p>
                        </div>

                        {error && (
                            <div className="text-red-500 dark:text-red-200 border border-red-200 dark:border-red-600 text-sm text-center py-3 px-4 bg-red-50 dark:bg-red-900 rounded-md flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className="space-y-4">
                            <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-border"
                                required
                            />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    className="border-border"
                                    required
                                />
                            </div>

                            <Button 
                                onClick={handleSignIn} 
                                className="w-full" 
                                disabled={isAuthActionInProgress || !email || !password}
                            >
                                {isAuthActionInProgress ? "Signing In..." : "Sign In"}
                            </Button>
                        </form>
                        <br/>
                    </div> 
                </div>
                <p className="text-center text-xs text-muted-foreground mt-8">
                    &copy; {new Date().getFullYear()} HookHQ
                </p> 
            </div>
        </div>
    </div>
    );
}
