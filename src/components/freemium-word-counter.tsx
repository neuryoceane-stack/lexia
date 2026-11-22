"use client";

import { useStudentEntitlement } from "@/components/student-entitlement-context";

/** Compteur discret « 14 mots sur 20 » (jamais anxiogène). */
export function FreemiumWordCounter({ className }: { className?: string }) {
  const entitlement = useStudentEntitlement();
  if (
    !entitlement?.freemiumActive ||
    entitlement.unlimited ||
    entitlement.personalWordTotal === 0
  ) {
    return null;
  }
  return (
    <p
      className={`m-0 text-sm text-muted ${className ?? ""}`.trim()}
      aria-live="polite"
    >
      {entitlement.activeWordCount} mot
      {entitlement.activeWordCount !== 1 ? "s" : ""} sur {entitlement.limit}
    </p>
  );
}