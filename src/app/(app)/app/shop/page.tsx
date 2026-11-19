"use client";

import { Suspense } from "react";
import { CheckCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { SHOP_ENABLED } from "@/lib/feature-flags";
import { ShopContent, ShopSkeleton } from "./shop-content";

export default function ShopPage() {
  if (!SHOP_ENABLED) return <ShopComingSoon />;
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopComingSoon() {
  const ARGUMENTS = [
    "Listes thématiques prêtes à réviser",
    "Pensées pour le collège, le lycée et la prépa",
    "Ajoutées directement à ta bibliothèque",
  ];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-2 py-12">
      <div className="w-full max-w-[460px] rounded-2xl border border-[color-mix(in_srgb,var(--ink)_18%,transparent)] bg-surface px-8 py-11 text-center shadow-[0_8px_40px_color-mix(in_srgb,var(--ink)_10%,transparent)] sm:px-9">
        <div className="relative mx-auto mb-6 flex w-fit justify-center">
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[20px] bg-surface">
            <ShoppingBag size={36} className="text-ink" aria-hidden />
          </span>
          <span className="absolute -right-3.5 -top-2 rounded-xl bg-mark px-2.5 py-1 text-[11px] font-medium text-ink">
            Bientôt
          </span>
        </div>
        <p className="text-[22px] font-medium text-ink">Le Lexi Shop arrive bientôt</p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Des listes conçues pour réviser vite et bien. La boutique ouvre très prochainement.
        </p>
        <ul className="mt-7 flex flex-col gap-3.5 text-left">
          {ARGUMENTS.map((arg) => (
            <li key={arg} className="flex items-center gap-3">
              <CheckCircle size={18} className="shrink-0 text-ink" aria-hidden />
              <span className="text-sm text-ink">{arg}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/app"
          className="mt-8 flex min-h-[50px] w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-surface no-underline"
        >
          Retour à mon tableau de bord
        </Link>
      </div>
    </div>
  );
}