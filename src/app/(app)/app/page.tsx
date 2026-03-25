import { getUser } from "@/lib/auth";
import { DashboardClient } from "./dashboard-client";

export default async function AppDashboardPage() {
  const user = await getUser();
  const role = user?.role;
  const canSeeDashboard = role === "etudiant" || role === "creator";

  return (
    <div className="mx-auto max-w-[1100px] bg-[var(--background)]">
      {canSeeDashboard && <DashboardClient />}
    </div>
  );
}
