import { getTeacherPilotRows } from "@/lib/teacher-pilot";

function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

export async function PilotSection() {
  const rows = await getTeacherPilotRows();

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="m-0 text-xl text-ink">Pilote professeurs</h2>
        <p className="m-0 mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Chaque professeur, ses classes et le retour naturel de ses élèves.
          Première liste : première révision d&apos;un mot d&apos;une liste de classe.
          Actif à J+7 : une révision ou une session à partir du septième jour après
          l&apos;inscription. Aucune relance n&apos;est envoyée.
        </p>
      </header>

      {rows.length === 0 ? (
        <section className="rounded-[14px] border border-line bg-surface px-6 py-16 text-center">
          <p className="m-0 text-sm text-muted">Aucun professeur inscrit pour le moment.</p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-4 py-3 font-medium">Professeur</th>
                <th className="px-3 py-3 font-medium">Classes</th>
                <th className="px-3 py-3 font-medium">Élèves</th>
                <th className="px-3 py-3 font-medium">Première liste</th>
                <th className="px-3 py-3 font-medium">Première révision</th>
                <th className="px-4 py-3 font-medium">Actifs à J+7</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.teacherId} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="m-0 font-medium text-ink">{row.name}</p>
                    <p className="m-0 mt-0.5 text-xs text-muted">
                      {row.email}
                      {row.schoolName ? ` · ${row.schoolName}` : ""}
                    </p>
                    <p className="m-0 mt-0.5 text-xs text-muted">
                      Inscrit le {formatDay(row.signedUpAt)}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-ink">{row.classCount}</td>
                  <td className="px-3 py-3 text-ink">{row.enrolledStudents}</td>
                  <td className="px-3 py-3 text-ink">{row.firstClassList}</td>
                  <td className="px-3 py-3 text-ink">{row.firstRevision}</td>
                  <td className="px-4 py-3 text-ink">
                    {row.eligibleAtDay7 === 0
                      ? "Pas encore à J+7"
                      : `${row.activeAtDay7} / ${row.eligibleAtDay7}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
