import { getUser } from "@/lib/auth";
import { DashboardClient } from "./dashboard-client";

export default async function AppDashboardPage() {
  const user = await getUser();
  const role = user?.role;
  const isStudent = role === "etudiant";

  return (
    <div className="mx-auto max-w-[1100px]">
      {isStudent && <DashboardClient />}
    </div>
  );
}
