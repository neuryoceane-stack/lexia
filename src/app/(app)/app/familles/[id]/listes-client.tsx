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
      className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
    >
      Créer une liste
    </Link>
  );
}
