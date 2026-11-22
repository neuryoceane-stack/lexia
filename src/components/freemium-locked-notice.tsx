import Link from "next/link";
import { Lock } from "lucide-react";
import { ABONNEMENT_PATH } from "@/lib/abonnement-path";

/** Message vouvoiement : mots conservés, abonnement les débloque. */
export function FreemiumLockedNotice({
  lockedCount,
  className,
}: {
  lockedCount: number;
  className?: string;
}) {
  if (lockedCount <= 0) return null;
  return (
    <aside
      className={`rounded-[14px] border border-line bg-surface px-4 py-3 text-sm text-muted ${className ?? ""}`.trim()}
      role="note"
    >
      <div className="flex gap-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden />
        <div className="min-w-0">
          <p className="m-0 text-ink">
            Vous avez {lockedCount} mot{lockedCount > 1 ? "s" : ""} verrouillé
            {lockedCount > 1 ? "s" : ""} sur l&apos;offre gratuite.
          </p>
          <p className="m-0 mt-1">
            Ils restent dans votre bibliothèque. Un abonnement les débloque pour
            la révision, sans rien supprimer.
          </p>
          <Link
            href={ABONNEMENT_PATH}
            className="mt-2 inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-white no-underline"
          >
            Voir l&apos;abonnement
          </Link>
        </div>
      </div>
    </aside>
  );
}