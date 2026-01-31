"use client";

import Link from "next/link";

export function ListesClient({
  familyId,
  familyName,
}: {
  familyId: string;
  familyName: string;
}) {
  return (
    <Link
      href={`/app/familles/${familyId}/nouvelle-liste`}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
    >
      Créer une liste
    </Link>
  );
}
