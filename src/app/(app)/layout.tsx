import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppHeader } from "@/components/app-header";
import { FeedbackWidget } from "@/components/feedback-widget";

export default async function AppLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const role = user.role;
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";
  const isProfesseurRoute = pathname.startsWith("/app/professeur");
  const isSharedRoute = pathname.startsWith("/app/familles")
    || pathname.startsWith("/app/parametres");
  if (role === "professeur" && !isProfesseurRoute && !isSharedRoute) redirect("/app/professeur");

  const showProfesseurHeader = role === "professeur";
  const isCreator = role === "creator";

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-900">
      <AppHeader user={user} isProfesseur={showProfesseurHeader} isCreator={isCreator} />
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <FeedbackWidget />
    </div>
  );
}
