import Link from "next/link";
import { Building2 } from "lucide-react";
import {
  STUDENT_TABS,
  creatorHref,
  type StudentTabId,
} from "./creator-sections";

export function StudentsSection({ onglet }: { onglet: StudentTabId }) {
  return (
    <div>
      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist" aria-label="Élèves">
        {STUDENT_TABS.map((tab) => {
          const active = tab.id === onglet;
          return (
            <Link
              key={tab.id}
              href={creatorHref("students", tab.id)}
              role="tab"
              aria-selected={active}
              className="inline-flex h-11 shrink-0 items-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              <span className={active ? "marker font-medium" : "whitespace-nowrap px-[7px] text-muted"}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {onglet === "etablissements" ? (
        <section>
          <h2 className="text-[28px] leading-tight text-ink">Établissements</h2>
          <p className="mt-1 text-sm text-muted">
            Établissements renseignés sur les comptes.
          </p>
          <div className="mt-5 rounded-[14px] border border-line bg-surface px-6 py-14 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
              <Building2 size={22} strokeWidth={1.75} aria-hidden />
            </span>
            <p className="mt-4 text-sm text-muted">
              Aucun établissement n&apos;est listé dans cet espace.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
