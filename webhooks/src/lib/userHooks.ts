import { initAuth } from "@/auth";
import { createDefaultApiKey } from "./userSetup";

/**
 * Hook to run after user creation
 * This can be called from the auth configuration or after successful signup
 */
export async function onUserCreated(userId: string, userData: { name?: string; email?: string }) {
    try {
        console.log(`User created: ${userId}, creating default API key...`);
        
        // Create a default API key for the new user
        const defaultKey = await createDefaultApiKey(userId, userData.name);
        
        console.log(`Default API key created for user ${userId}`);
        
        return { apiKey: defaultKey };
    } catch (error) {
        console.error(`Failed to create default API key for user ${userId}:`, error);
        // Don't throw here as we don't want to break the user creation process
        return null;
    }
}

/**
 * Hook to run after user signup (client-side)
 * This can be called from the signup success handler
 */
export async function onUserSignupSuccess(userData: { id: string; name?: string; email?: string }) {
    try {
        // Call the server-side hook
        const response = await fetch("/api/user-hooks/on-created", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: userData.id,
                userData: {
                    name: userData.name,
                    email: userData.email,
                },
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to create default API key");
        }

        const result = await response.json();
        console.log("Default API key created:", result);
        
        return result;
    } catch (error) {
        console.error("Error in user signup hook:", error);
        return null;
    }
}
