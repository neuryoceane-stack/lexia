import { AnnouncementsSection } from "./announcements-section";
import { ChurnSection } from "./churn-section";
import { CreatorNav } from "./creator-nav";
import { CreatorShopTab } from "./creator-shop-tab";
import { EmptySection } from "./empty-section";
import { FeedbacksSection } from "./feedbacks-section";
import { FinanceSection } from "./finance-section";
import { OverviewSection } from "./overview-section";
import { PromoSection } from "./promo-section";
import { StudentsSection } from "./students-section";
import type { CreatorSectionId, StudentTabId } from "./creator-sections";

export function CreatorShell({
  section,
  onglet,
}: {
  section: CreatorSectionId;
  onglet: StudentTabId;
}) {
  return (
    <div className="mx-auto w-full max-w-[1104px]">
      <h1 className="mb-6 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px] md:mb-8 md:text-[46px]">
        Espace <span className="marker">créateur</span>
      </h1>
      <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-start md:gap-10">
        <CreatorNav section={section} />
        <div className="min-w-0">
          {section === "overview" && <OverviewSection />}
          {section === "funnel" && <EmptySection id="funnel" />}
          {section === "students" && <StudentsSection onglet={onglet} />}
          {section === "health" && <FeedbacksSection />}
          {section === "finance" && <FinanceSection />}
          {section === "churn" && <ChurnSection />}
          {section === "shop" && <CreatorShopTab />}
          {section === "promo" && <PromoSection />}
          {section === "announcements" && <AnnouncementsSection />}
        </div>
      </div>
    </div>
  );
}
