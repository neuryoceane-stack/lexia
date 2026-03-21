import { redirect } from "next/navigation";

/** Ancienne URL : la création de classe se fait via la modale sur /app/professeur/classes. */
export default function NouvelleClasseRedirectPage() {
  redirect("/app/professeur/classes?creer=1");
}
