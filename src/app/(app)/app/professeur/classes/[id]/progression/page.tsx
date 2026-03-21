import { redirect } from "next/navigation";

/**
 * URL canonique « progression » : onglet Élèves (statistiques par élève).
 */
export default async function ClasseProgressionRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/professeur/classes/${id}?tab=eleves`);
}
