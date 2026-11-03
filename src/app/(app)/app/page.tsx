import { getUser } from "@/lib/auth";
import { DashboardClient, type HomeDashboardInitial } from "./dashboard-client";
import { loadHomeDashboard } from "@/lib/home-page.server";

export default async function AppDashboardPage() {
  const user = await getUser();
  const role = user?.role;
  const canSeeDashboard = role === "etudiant" || role === "creator";

  let initial: HomeDashboardInitial | undefined;
  if (canSeeDashboard && user?.id) {
    initial = await loadHomeDashboard(user.id);
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      {canSeeDashboard && <DashboardClient initial={initial} />}
    </div>
  );
}
