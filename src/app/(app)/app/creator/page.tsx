import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { CreatorShell } from "./creator-shell";
import {
  creatorHref,
  parseCreatorSection,
  parseStudentTab,
} from "./creator-sections";

export default async function CreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; onglet?: string }>;
}) {
  const user = await getUser();
  if (!user || user.role !== "creator") redirect("/app");

  const params = await searchParams;
  const section = parseCreatorSection(params.section);
  if (params.section && params.section !== section) redirect("/app/creator");

  const onglet = parseStudentTab(params.onglet);
  if (section === "students" && params.onglet && params.onglet !== onglet) {
    redirect("/app/creator?section=students");
  }
  if (section !== "students" && params.onglet) redirect(creatorHref(section));

  return <CreatorShell section={section} onglet={onglet} />;
}
