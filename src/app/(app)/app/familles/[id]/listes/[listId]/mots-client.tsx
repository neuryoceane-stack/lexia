"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mot = { id: string; term: string; definition: string; rank: number };

export function MotsClient({
  familyId,
  listId,
  initialMots,
}: {
  familyId: string;
  listId: string;
  initialMots: Mot[];
}) {
  const router = useRouter();
  const [mots, setMots] = useState<Mot[]>(initialMots);
  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDef, setEditDef] = useState("");

  async function addWord() {
    const term = newTerm.trim();
    if (!term) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listes/${listId}/mots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, definition: newDef.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoading(false);
        return;
      }
      setMots((prev) => [...prev, data]);
      setNewTerm("");
      setNewDef("");
      setAdding(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function updateWord(wordId: string, term: string, definition: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/mots/${wordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: term.trim(), definition: definition.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setMots((prev) =>
        prev.map((m) => (m.id === wordId ? { ...m, term: data.term, definition: data.definition } : m))
      );
      setEditingId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteWord(wordId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/mots/${wordId}`, { method: "DELETE" });
      if (!res.ok) return;
      setMots((prev) => prev.filter((m) => m.id !== wordId));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(m: Mot) {
    setEditingId(m.id);
    setEditTerm(m.term);
    setEditDef(m.definition);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-800 dark:text-slate-100">
          Mots ({mots.length})
        </h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            + Ajouter un mot
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Mot"
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <input
              type="text"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              placeholder="Définition"
              className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={addWord}
              disabled={loading || !newTerm.trim()}
              className="btn-relief rounded-lg bg-primary px-3 py-2 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn-relief rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {mots.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            {editingId === m.id ? (
              <>
                <input
                  type="text"
                  value={editTerm}
                  onChange={(e) => setEditTerm(e.target.value)}
                  className="flex-1 min-w-[100px] rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={editDef}
                  onChange={(e) => setEditDef(e.target.value)}
                  className="flex-1 min-w-[100px] rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => updateWord(m.id, editTerm, editDef)}
                  disabled={loading}
                  className="btn-relief rounded bg-primary px-2 py-1 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="btn-relief rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-400"
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {m.term}
                </span>
                {m.definition && (
                  <span className="text-slate-600 dark:text-slate-400">
                    {m.definition}
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="btn-relief rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWord(m.id)}
                    disabled={loading}
                    className="btn-relief rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {mots.length === 0 && !adding && (
        <p className="text-slate-500 dark:text-slate-400">
          Aucun mot dans cette liste.
        </p>
      )}
    </div>
  );
}
