import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BibliothequeClient } from "./bibliotheque-client";

export default async function BibliothequePage() {
  const user = await getUser();
  if (!user?.id) redirect("/login");

  return (
    <div className="bg-[var(--background)]">
      <BibliothequeClient />
    </div>
  );
}
