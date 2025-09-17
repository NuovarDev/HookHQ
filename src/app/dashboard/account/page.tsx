import { initAuth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export default async function AccountPage() {
  const authInstance = await initAuth();
  // Fetch session using next/headers per better-auth docs for server components
  const session = await authInstance.api.getSession({ headers: await headers() });

  if (!session) {
      redirect("/"); // Redirect to home if no session
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account information and security settings.
        </p>
      </div>

      <AccountForm user={session.user} />

      <div className="border-t pt-6">
        <DeleteAccountButton />
      </div>
    </div>
  );
}
