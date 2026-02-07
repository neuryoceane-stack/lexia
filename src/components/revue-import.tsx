"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { detectListLanguages } from "@/lib/language";

export type RevueItem = { term: string; definition: string };

export function RevueImport({
  familyId,
  initialItems,
  source,
  onSaved,
  onCancel,
}: {
  familyId: string;
  initialItems: RevueItem[];
  source: "pdf" | "ocr";
  onSaved: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<RevueItem[]>(initialItems);
  const [index, setIndex] = useState(0);
  const [listName, setListName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<RevueItem | null>(null);

  const current = items[index];

  const { termLang, termFlag, defFlag } = useMemo(
    () =>
      detectListLanguages(
        items.map((i) => i.term),
        items.map((i) => i.definition)
      ),
    [items]
  );

  const markDiscard = useCallback(() => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (index >= items.length - 1) setIndex(Math.max(0, items.length - 2));
  }, [index, items.length]);

  const markKeep = useCallback(() => {
    if (index < items.length - 1) setIndex((i) => i + 1);
  }, [index, items.length]);

  const keepAllRest = useCallback(() => {
    setIndex(items.length);
  }, [items.length]);

  const openEdit = useCallback(() => {
    setEditing(current ?? null);
  }, [current]);

  const saveEdit = useCallback(
    (term: string, definition: string) => {
      if (editing && current) {
        setItems((prev) =>
          prev.map((item, i) =>
            i === index ? { term: term.trim(), definition: definition.trim() } : item
          )
        );
        setEditing(null);
      }
    },
    [editing, index, current]
  );

  async function handleSaveList() {
    const name = listName.trim();
    if (!name) {
      setError("Donne un nom à la liste.");
      return;
    }
    const words = items
      .map((i) => ({ term: i.term.trim(), definition: i.definition.trim() }))
      .filter((w) => w.term.length > 0);
    if (words.length === 0) {
      setError("Aucun mot à enregistrer. Garde ou modifie au moins un mot.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const listRes = await fetch(`/api/familles/${familyId}/listes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          source,
          language: termLang || undefined,
        }),
      });
      const listData = await listRes.json().catch(() => ({}));
      if (!listRes.ok) {
        setError(listData.error ?? "Erreur création liste");
        setSaving(false);
        return;
      }
      const listId = listData.id;
      const wordsRes = await fetch(`/api/listes/${listId}/mots/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      if (!wordsRes.ok) {
        setError("Liste créée mais erreur lors de l’ajout des mots.");
        setSaving(false);
        return;
      }
      onSaved();
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 font-medium text-slate-800 dark:text-slate-100">
          Modifier le mot
        </h2>
        <EditForm
          term={editing.term}
          definition={editing.definition}
          onSave={(t, d) => {
            saveEdit(t, d);
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-400">
          Aucun mot à réviser. Tu as tout supprimé.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const restCount = items.length - index - 1;

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Réviser les mots extraits
        </h2>
        {(termFlag || defFlag) && (
          <span className="text-xl" title="Langues détectées">
            {termFlag}
            {termFlag && defFlag && (
              <span className="mx-1 text-slate-400" aria-hidden>→</span>
            )}
            {defFlag}
          </span>
        )}
        {index < items.length && restCount > 0 && (
          <button
            type="button"
            onClick={keepAllRest}
            className="ml-auto rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary-dark hover:bg-primary/20 dark:border-primary-light dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30"
            aria-label="Garder tout le reste"
          >
            Garder tout le reste ({restCount} fiche{restCount > 1 ? "s" : ""})
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Garde, modifie ou supprime chaque mot. Puis donne un nom à la liste et enregistre.
      </p>

      {/* Carte type Tinder */}
      {current ? (
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg dark:border-slate-600 dark:bg-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Mot {index + 1} / {items.length}
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
              {current.term}
            </p>
            {current.definition && (
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {current.definition}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={markDiscard}
                className="rounded-full bg-red-100 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                aria-label="Supprimer"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={openEdit}
                className="rounded-full bg-amber-100 px-5 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                aria-label="Modifier"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={markKeep}
                className="rounded-full bg-primary/20 px-5 py-2.5 text-sm font-medium text-primary-dark hover:bg-primary/30 dark:bg-primary/30 dark:text-primary-light dark:hover:bg-primary/40"
                aria-label="Garder"
              >
                Garder
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          Toutes les fiches ont été parcourues. Donne un nom à la liste et enregistre ci-dessous.
        </p>
      )}

      {/* Enregistrer la liste */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 font-medium text-slate-800 dark:text-slate-100">
          Enregistrer la liste
        </h3>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {items.length} mot(s) conservé(s). Donne un nom puis enregistre.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="revue-list-name"
              className="mb-1 block text-sm text-slate-600 dark:text-slate-400"
            >
              Nom de la liste
            </label>
            <input
              id="revue-list-name"
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="ex. Mots extraits du PDF"
              className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveList}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Tout enregistrer"}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

function EditForm({
  term,
  definition,
  onSave,
  onCancel,
}: {
  term: string;
  definition: string;
  onSave: (term: string, definition: string) => void;
  onCancel: () => void;
}) {
  const [t, setT] = useState(term);
  const [d, setD] = useState(definition);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
          Mot / terme
        </label>
        <input
          type="text"
          value={t}
          onChange={(e) => setT(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
          Traduction / définition
        </label>
        <input
          type="text"
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => onSave(t, d)}
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
