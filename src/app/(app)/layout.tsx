import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppHeader } from "@/components/app-header";
import { FeedbackWidget } from "@/components/feedback-widget";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingWrapper } from "@/components/onboarding-wrapper";

export default async function AppLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const role = user.role;
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";
  const isProfesseurRoute = pathname.startsWith("/app/professeur");
  const isSharedRoute = pathname.startsWith("/app/familles") || pathname.startsWith("/app/parametres");

  if (role === "professeur" && !isProfesseurRoute && !isSharedRoute) redirect("/app/professeur");

  const showProfesseurHeader = role === "professeur";
  const isCreator = role === "creator";

  // Vérifier si l'onboarding a été complété
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  const showOnboarding = profile ? !profile.onboardingCompleted : false;
  const userRole = role === "professeur" ? "professeur" : "etudiant";

  return (
    <div className="min-h-screen">
      <AppHeader user={user} isProfesseur={showProfesseurHeader} isCreator={isCreator} />
      <main className="page-fade-in mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <FeedbackWidget />
      {showOnboarding && <OnboardingWrapper role={userRole} />}
    </div>
  );
}
