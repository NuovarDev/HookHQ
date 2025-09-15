import { initAuth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export default async function DashboardPage() {
  const authInstance = await initAuth();
  // Fetch session using next/headers per better-auth docs for server components
  const session = await authInstance.api.getSession({ headers: await headers() });

  if (!session) {
      redirect("/"); // Redirect to home if no session
  }

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-3xl">
          <p className="text-lg">
            Welcome,{" "}
            <span className="font-semibold">
              {session.user?.name || session.user?.email || "User"}
            </span>
            !
          </p>
          {session.user?.email && (
            <p className="text-md break-words">
              <strong>Email:</strong>{" "}
              <span className="break-all">{session.user.email}</span>
            </p>
          )}
          {session.user?.name && (
            <p className="text-md">
              <strong>Name:</strong> {session.user.name}
            </p>
          )}
          {session.user?.emailVerified !== undefined && (
            <p className="text-md">
              <strong>Email Verified:</strong>{" "}
              <span
                className={
                  session.user.emailVerified ? "text-green-600" : "text-orange-600"
                }
              >
                {session.user.emailVerified ? "Yes" : "No"}
              </span>
            </p>
          )}
          {session.user?.id && (
            <p className="text-md">
              <strong>User ID:</strong> {session.user.id}
            </p>
          )}

          <DeleteAccountButton />
        </div>
      </main>
    </div>
  );
}
