"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleDeleteAccount = async () => {
        if (confirmationText !== "DELETE MY ACCOUNT") {
            setError("Please type 'DELETE MY ACCOUNT' exactly as shown");
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch("/api/account/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ confirmationText }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete account");
            }

            // Account deleted successfully, redirect to home page
            alert("Your account has been deleted successfully. You will be redirected to the home page.");
            router.push("/");
            
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    const resetDialog = () => {
        setConfirmationText("");
        setError(null);
        setIsDeleting(false);
    };

    return (
        <Card className="border-red-200">
            <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                </CardTitle>
                <CardDescription>
                    Once you delete your account, there is no going back. Please be certain.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetDialog();
                }}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Account
                            </DialogTitle>
                            <DialogDescription className="space-y-2">
                                <p>This action cannot be undone. This will permanently delete:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>Your account and profile</li>
                                    <li>All your API keys</li>
                                    <li>All your sessions</li>
                                    <li>All associated data</li>
                                </ul>
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800 font-medium mb-2">
                                    To confirm, please type <span className="font-mono bg-red-100 px-1 rounded">DELETE MY ACCOUNT</span> in the box below:
                                </p>
                                <Input
                                    placeholder="Type DELETE MY ACCOUNT"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    className="border-red-300 focus:border-red-500"
                                />
                            </div>
                            
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}
                        </div>
                        
                        <DialogFooter className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || confirmationText !== "DELETE MY ACCOUNT"}
                            >
                                {isDeleting ? "Deleting Account..." : "Delete Account"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
