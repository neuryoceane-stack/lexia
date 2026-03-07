import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { CreatorTabs } from "./creator-tabs";

export default async function CreatorPage() {
  const user = await getUser();
  if (!user || user.role !== "creator") redirect("/app");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">
        ⚡ Creator Dashboard
      </h1>
      <CreatorTabs />
    </div>
  );
}
