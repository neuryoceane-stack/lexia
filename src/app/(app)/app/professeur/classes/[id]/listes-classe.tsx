"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ClassList = {
  id: string;
  listId: string | null;
  isVisible: boolean;
  name: string;
  familyName: string;
};

type BibliothequeList = {
  id: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
};

type Props = {
  classId: string;
  classLanguage: string | null;
  lists: ClassList[];
  className?: string;
};

export function ListesClasse({
  classId,
  classLanguage,
  lists: initialLists,
  className = "",
}: Props) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);

  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);
  const [bibliotheque, setBibliotheque] = useState<BibliothequeList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bibliotheque")
      .then((r) => r.json())
      .then((data) => setBibliotheque(data.lists ?? []))
      .catch(() => {});
  }, []);

  const addedListIds = new Set(lists.map((l) => l.listId).filter(Boolean));
  const availableLists = bibliotheque.filter((l) => !addedListIds.has(l.id));

  async function handleAdd() {
    if (!selectedListId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/classes/${classId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: selectedListId }),
      });
      if (res.ok) {
        router.refresh();
        setSelectedListId("");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleVisibility(listId: string, isVisible: boolean) {
    setMenuOpen(null);
    try {
      const res = await fetch(`/api/classes/${classId}/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !isVisible }),
      });
      if (res.ok) router.refresh();
    } catch {}
  }

  return (
    <section className={className}>
      <h2 className="mb-4 text-lg font-semibold text-vocab-gray dark:text-slate-100">
        Listes de vocabulaire
      </h2>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={selectedListId}
          onChange={(e) => setSelectedListId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-vocab-gray focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">— Ajouter une liste —</option>
          {availableLists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.familyName} / {l.name} ({l.wordCount} mots)
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedListId || adding}
          className="btn-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {adding ? "Ajout…" : "Ajouter"}
        </button>
      </div>

      {lists.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/30 dark:text-slate-400">
          Aucune liste. Ajoutez des listes depuis votre bibliothèque. Elles seront en mode fantôme par défaut.
        </p>
      ) : (
        <ul className="space-y-2">
          {lists.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    l.isVisible ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  title={l.isVisible ? "Visible pour les élèves" : "Mode fantôme (invisible)"}
                />
                <div>
                  <span className="font-medium text-vocab-gray dark:text-slate-200">
                    {l.name}
                  </span>
                  {l.familyName && (
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                      {l.familyName}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(menuOpen === l.listId ? null : l.listId ?? "")}
                  className="btn-relief flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-vocab-gray dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label="Options"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>
                {menuOpen === l.listId && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(null)}
                      aria-hidden
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(l.listId!, l.isVisible)}
                        className="block w-full px-3 py-2 text-left text-sm text-vocab-gray hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {l.isVisible ? "Masquer (mode fantôme)" : "Rendre visible pour les élèves"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
