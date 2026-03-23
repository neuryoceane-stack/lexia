import { redirect } from "next/navigation";

/** Alias demandé pour le lien « Retour » depuis la sélection de listes (révision). */
export default function EvaluationAliasPage() {
  redirect("/app/revision");
}
