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
  const [bulkError, setBulkError] = useState<string | null>(null);

  const pending = members.filter((m) => m.status === "pending");
  const accepted = members.filter((m) => m.status === "accepted");
  const rejected = members.filter((m) => m.status === "rejected");

  async function handleStatus(userId: string, status: "accepted" | "rejected") {
    setLoading(userId);
    setBulkError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBulkError(
          typeof data.error === "string" ? data.error : "L'action n'a pas abouti."
        );
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function acceptAll() {
    setLoading("all");
    setBulkError(null);
    try {
      for (const member of pending) {
        if (!member.userId) continue;
        const res = await fetch(`/api/classes/${classId}/members/${member.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setBulkError(
            typeof data.error === "string"
              ? data.error
              : "Certains élèves n'ont pas pu être acceptés."
          );
          router.refresh();
          return;
        }
      }
      router.refresh();
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-ink">
              Salle d&apos;attente ({pending.length})
            </h3>
            <button
              type="button"
              onClick={acceptAll}
              disabled={loading !== null}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-surface disabled:opacity-50"
            >
              {loading === "all" ? "Acceptation…" : "Tout accepter"}
            </button>
          </div>
          {bulkError ? (
            <p className="mb-3 text-sm text-false-text" role="alert">
              {bulkError}
            </p>
          ) : null}
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

      {rejected.length > 0 && (
        <div className="mt-6 rounded-xl border border-line bg-surface p-4">
          <h3 className="mb-3 text-sm font-medium text-muted">
            Demandes refusées ({rejected.length})
          </h3>
          <ul className="space-y-2">
            {rejected.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
              >
                <span className="font-medium text-ink">{m.name}</span>
                <button
                  type="button"
                  onClick={() => handleStatus(m.userId!, "accepted")}
                  disabled={loading === m.userId}
                  className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink disabled:opacity-50"
                >
                  {loading === m.userId ? "…" : "Accepter"}
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
