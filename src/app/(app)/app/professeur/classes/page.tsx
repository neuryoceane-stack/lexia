import { getUser } from "@/lib/auth";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { getTeacherClassesListStats } from "@/lib/teacher-classes-list-stats";
import { MesClassesView } from "./mes-classes-view";

export default async function MesClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ creer?: string }>;
}) {
  const user = await getUser();
  if (!user?.id) return null;

  const sp = await searchParams;
  const initialOpenCreerModal =
    sp.creer === "1" || sp.creer === "true";

  const { rows, totalDistinctStudents } = await getTeacherClassesListStats(
    user.id
  );

  return (
    <MesClassesView
      rows={rows}
      totalDistinctStudents={totalDistinctStudents}
      initialOpenCreerModal={initialOpenCreerModal}
      allLanguages={PREFERRED_LANGUAGE_OPTIONS}
    />
  );
}
