import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BibliothequeClient } from "./bibliotheque-client";

export default async function BibliothequePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div>
      <BibliothequeClient />
    </div>
  );
}
