"use client";

type Member = {
  id: string;
  userId: string | null;
  status: string;
  name: string;
  email: string | null;
  stats: { sessions: number; wordsRetained: number; wordsWritten: number } | null;
};

type Props = {
  members: Member[];
};

export function StatsEleves({ members }: Props) {
  const accepted = members.filter((m) => m.status === "accepted");

  if (accepted.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-vocab-gray dark:text-slate-100">
        Statistiques des élèves
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-3 font-medium text-vocab-gray dark:text-slate-200">
                Élève
              </th>
              <th className="px-4 py-3 font-medium text-vocab-gray dark:text-slate-200">
                Sessions
              </th>
              <th className="px-4 py-3 font-medium text-vocab-gray dark:text-slate-200">
                Mots retenus
              </th>
              <th className="px-4 py-3 font-medium text-vocab-gray dark:text-slate-200">
                Mots écrits
              </th>
            </tr>
          </thead>
          <tbody>
            {accepted.map((m) => (
              <tr
                key={m.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-700"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-vocab-gray dark:text-slate-200">
                    {m.name}
                  </span>
                  {m.email && (
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      {m.email}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {m.stats?.sessions ?? 0}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {m.stats?.wordsRetained ?? 0}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {m.stats?.wordsWritten ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
