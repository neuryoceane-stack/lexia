"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { NouvelleListeFlow } from "@/components/nouvelle-liste-flow";

function NouvelleListeFallback() {
  return <p className="text-sm text-[var(--foreground-muted)]">Chargement…</p>;
}

function NouvelleListeForFamily() {
  const params = useParams();
  const familyId = params.id as string;
  return <NouvelleListeFlow familyId={familyId} />;
}

export default function NouvelleListePage() {
  return (
    <Suspense fallback={<NouvelleListeFallback />}>
      <NouvelleListeForFamily />
    </Suspense>
  );
}
