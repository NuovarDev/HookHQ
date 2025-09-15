import { initAuth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardMetrics from "@/components/DashboardMetrics";
import EnvironmentGate from "@/components/EnvironmentGate";

export default async function DashboardPage() {
  const authInstance = await initAuth();
  // Fetch session using next/headers per better-auth docs for server components
  const session = await authInstance.api.getSession({ headers: await headers() });

  if (!session) {
      redirect("/"); // Redirect to home if no session
  }

  return (
    <EnvironmentGate>
      <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
        <DashboardMetrics />
      </div>
    </EnvironmentGate>
  );
}
