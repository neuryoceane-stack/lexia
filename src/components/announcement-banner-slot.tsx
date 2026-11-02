import { Suspense } from "react";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { readStudentBanner } from "@/lib/announcements-server";

/** Bannière sous l'en-tête. Le chargement ne bloque pas le reste de la page. */
export function AnnouncementBannerSlot({ userId }: { userId: string }) {
  return (
    <Suspense fallback={null}>
      <AnnouncementBannerLoader userId={userId} />
    </Suspense>
  );
}

async function AnnouncementBannerLoader({ userId }: { userId: string }) {
  const banner = await readStudentBanner(userId);
  if (!banner) return null;
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 sm:px-6">
      <AnnouncementBanner announcement={banner} />
    </div>
  );
}
