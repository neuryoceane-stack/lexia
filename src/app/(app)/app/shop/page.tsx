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
    "Ajoutées directement à votre bibliothèque",
  ];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-2 py-12">
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-surface px-8 py-11 text-center sm:px-9">
        <div className="relative mx-auto mb-6 flex w-fit justify-center">
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[20px] border border-line bg-surface">
            <ShoppingBag size={36} className="text-ink" aria-hidden />
          </span>
          <span className="marker absolute -right-3.5 -top-2 text-[11px] font-medium text-ink">Bientôt</span>
        </div>
        <h1 className="font-heading text-[22px] font-bold text-ink">
          Le Lexi Shop arrive <span className="marker">bientôt</span>
        </h1>
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
          className="mt-8 flex min-h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-surface no-underline"
        >
          Retour à votre tableau de bord
        </Link>
      </div>
    </div>
  );
}