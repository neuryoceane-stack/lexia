import { Funnel, Megaphone, UserMinus, type LucideIcon } from "lucide-react";
import type { EmptySectionId } from "./creator-sections";

const EMPTY: Record<EmptySectionId, { title: string; icon: LucideIcon }> = {
  funnel: { title: "Entonnoir et coûts", icon: Funnel },
  churn: { title: "Désabonnements", icon: UserMinus },
  announcements: { title: "Annonces", icon: Megaphone },
};

export function EmptySection({ id }: { id: EmptySectionId }) {
  const { title, icon: Icon } = EMPTY[id];
  return (
    <section className="rounded-[14px] border border-line bg-surface px-6 py-16 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
        <Icon size={22} strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-[28px] leading-tight text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">Bientôt disponible</p>
    </section>
  );
}
