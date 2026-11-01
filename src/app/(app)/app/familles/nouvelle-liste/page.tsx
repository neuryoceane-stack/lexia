"use client";

import { Suspense } from "react";
import { NouvelleListeFlow } from "@/components/nouvelle-liste-flow";

function NouvelleListeFallback() {
  return <p className="text-sm text-[var(--foreground-muted)]">Chargement…</p>;
}

export default function NouvelleListePage() {
  return (
    <Suspense fallback={<NouvelleListeFallback />}>
      <NouvelleListeFlow />
    </Suspense>
  );
}
