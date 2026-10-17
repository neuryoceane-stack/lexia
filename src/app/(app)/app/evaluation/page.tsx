import { redirect } from "next/navigation";
import { redirectIfStudentPaywalled } from "@/lib/paywall";

/** Alias demandé pour le lien « Retour » depuis la sélection de listes (révision). */
export default async function EvaluationAliasPage() {
  await redirectIfStudentPaywalled();
  redirect("/app/revision");
}
