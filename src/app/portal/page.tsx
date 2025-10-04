"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PortalTokenPayload } from "@/lib/portalAuth";
import PortalLayout from "@/components/portal/PortalLayout";
import EndpointsList from "@/components/portal/EndpointsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoaderCircle, AlertCircle } from "lucide-react";

function PortalPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    loading: boolean;
    authenticated: boolean;
    payload?: PortalTokenPayload;
    error?: string;
  }>({
    loading: true,
    authenticated: false
  });

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setAuthState({
        loading: false,
        authenticated: false,
        error: "No access token provided"
      });
      return;
    }

    // Verify token on server side
    fetch(`/api/portal/verify?token=${encodeURIComponent(token)}`)
      .then(response => response.json())
      .then((data: any) => {
        if (data.valid) {
          setAuthState({
            loading: false,
            authenticated: true,
            payload: data.payload
          });
        } else {
          setAuthState({
            loading: false,
            authenticated: false,
            error: data.error || "Token verification failed"
          });
        }
      })
      .catch(error => {
        setAuthState({
          loading: false,
          authenticated: false,
          error: "Failed to verify token"
        });
      });
  }, [searchParams]);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authState.authenticated || !authState.payload) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {authState.error || "Authentication failed"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const { payload } = authState;
  const theme = searchParams.get("theme") as "light" | "dark" || "light";

  return (
    <PortalLayout
      applicationName={payload.applicationName}
      returnUrl={payload.returnUrl}
      token={searchParams.get("token")!}
      theme={theme}
    >
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-2`}>
            Event Destinations
          </h1>
        </div>

        <EndpointsList 
          endpointGroupId={payload.endpointGroupId}
          environmentId={payload.environmentId}
          token={searchParams.get("token")!}
          theme={theme}
        />
      </div>
    </PortalLayout>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PortalPageContent />
    </Suspense>
  );
}