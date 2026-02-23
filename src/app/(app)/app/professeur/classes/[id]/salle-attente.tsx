"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  userId: string | null;
  status: string;
  joinedAt: Date | null;
  name: string;
  email: string | null;
  stats: { sessions: number; wordsRetained: number; wordsWritten: number } | null;
};

type Props = {
  classId: string;
  members: Member[];
  className?: string;
};

export function SalleAttente({ classId, members, className = "" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const pending = members.filter((m) => m.status === "pending");
  const accepted = members.filter((m) => m.status === "accepted");
  const rejected = members.filter((m) => m.status === "rejected");

  async function handleStatus(userId: string, status: "accepted" | "rejected") {
    setLoading(userId);
    try {
      const res = await fetch(`/api/classes/${classId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className={className}>
      <h2 className="mb-4 text-lg font-semibold text-vocab-gray dark:text-slate-100">
        Élèves
      </h2>

      {pending.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <h3 className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-200">
            Salle d&apos;attente ({pending.length})
          </h3>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/80 bg-white px-3 py-2 dark:border-amber-700/50 dark:bg-slate-800/50"
              >
                <div>
                  <span className="font-medium text-vocab-gray dark:text-slate-200">
                    {m.name}
                  </span>
                  {m.email && (
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                      {m.email}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatus(m.userId!, "accepted")}
                    disabled={loading === m.userId}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading === m.userId ? "…" : "Accepter"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(m.userId!, "rejected")}
                    disabled={loading === m.userId}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
                  >
                    Refuser
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            Membres acceptés ({accepted.length})
          </h3>
          <ul className="space-y-2">
            {accepted.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700"
              >
                <span className="font-medium text-vocab-gray dark:text-slate-200">
                  {m.name}
                </span>
                {m.email && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {m.email}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pending.length === 0 && accepted.length === 0 && rejected.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/30 dark:text-slate-400">
          Aucun élève pour le moment. Partagez l&apos;identifiant de la classe pour qu&apos;ils puissent rejoindre.
        </p>
      )}
    </section>
  );
}
