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
  /** Ignoré ici ; présent quand les données viennent de la page détail. */
  progress?: {
    masteryPct: number;
    wordsMastered: number;
    lastActivityAt: string | null;
  };
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
      <h2 className="mb-4 text-lg font-semibold text-vocab-gray">
        Élèves
      </h2>

      {pending.length > 0 && (
        <div className="mb-6 rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-3 text-sm font-medium text-ink">
            Salle d&apos;attente ({pending.length})
          </h3>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2"
              >
                <div>
                  <span className="font-medium text-vocab-gray">
                    {m.name}
                  </span>
                  {m.email && (
                    <span className="ml-2 text-sm text-muted">
                      {m.email}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatus(m.userId!, "accepted")}
                    disabled={loading === m.userId}
                    className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:bg-ink-hover disabled:opacity-50"
                  >
                    {loading === m.userId ? "…" : "Accepter"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(m.userId!, "rejected")}
                    disabled={loading === m.userId}
                    className="rounded-lg bg-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface hover:border-ink disabled:opacity-50"
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
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-3 text-sm font-medium text-muted">
            Membres acceptés ({accepted.length})
          </h3>
          <ul className="space-y-2">
            {accepted.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-vocab-gray">
                    {m.name}
                  </span>
                  {m.email && (
                    <span className="ml-2 text-sm text-muted">
                      {m.email}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleStatus(m.userId!, "rejected")}
                  disabled={loading === m.userId}
                  className="btn-relief rounded-lg px-2.5 py-1.5 text-xs font-medium text-false-text hover:bg-false-bg disabled:opacity-50"
                >
                  {loading === m.userId ? "…" : "Supprimer de la classe"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pending.length === 0 && accepted.length === 0 && rejected.length === 0 && (
        <p className="rounded-xl border border-dashed border-line bg-surface py-8 text-center text-sm text-muted">
          Aucun élève pour le moment. Partagez l&apos;identifiant de la classe pour qu&apos;ils puissent rejoindre.
        </p>
      )}
    </section>
  );
}
