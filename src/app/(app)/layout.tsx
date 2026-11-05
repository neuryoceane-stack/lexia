import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppHeader } from "@/components/app-header";
import { FeedbackWidget } from "@/components/feedback-widget";
import { PaywallBlockedProvider } from "@/components/paywall-gate";
import { AnnouncementBannerSlot } from "@/components/announcement-banner-slot";
import { isStudentPaywalled } from "@/lib/paywall";
import { getLayoutUserProfile } from "@/lib/user-profile-layout.server";
import { OnboardingWrapperLazy } from "@/components/onboarding-wrapper-lazy";

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

  const [profile, paywalled] = await Promise.all([
    getLayoutUserProfile(user.id),
    isStudentPaywalled(user),
  ]);
  const showOnboarding = profile ? !profile.onboardingCompleted : false;
  const userRole = role === "professeur" ? "professeur" : "etudiant";

  return (
    <PaywallBlockedProvider blocked={paywalled}>
      <div className="min-h-screen">
        <AppHeader user={user} isProfesseur={showProfesseurHeader} isCreator={isCreator} />
        {role === "etudiant" ? <AnnouncementBannerSlot userId={user.id} /> : null}
        <main className="page-fade-in mx-auto min-w-0 max-w-[1200px] overflow-x-clip px-4 pb-40 pt-8 sm:px-6 md:py-10">{children}</main>
        <FeedbackWidget />
        {/* Le tutoriel ouvre la révision : il attend que l'élève ait accès. */}
        {showOnboarding && !paywalled && <OnboardingWrapperLazy role={userRole} />}
      </div>
    </PaywallBlockedProvider>
  );
}
