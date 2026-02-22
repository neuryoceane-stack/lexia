"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { toIso6391 } from "@/lib/language";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";

type List = { id: string; familyId: string; name: string; language: string | null };
type Word = { id: string; term: string; definition: string };

type Row = {
  id: string;
  term: string;
  definition: string;
  termTranslated: string;
  definitionTranslated: string;
};

export default function DupliquerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = searchParams.get("listId");
  const fromLang = searchParams.get("from") || "eng";
  const toLang = searchParams.get("to") || "fra";

  const [list, setList] = useState<List | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [translateProgress, setTranslateProgress] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toLabel = PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === toLang)?.label ?? toLang;

  const fetchList = useCallback(async () => {
    if (!listId) return null;
    const res = await fetch(`/api/listes/${listId}`);
    if (!res.ok) return null;
    return res.json() as Promise<List>;
  }, [listId]);

  const fetchWords = useCallback(async () => {
    if (!listId) return [];
    const res = await fetch(`/api/listes/${listId}/mots`);
    if (!res.ok) return [];
    return res.json() as Promise<Word[]>;
  }, [listId]);

  useEffect(() => {
    if (!listId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [listData, wordsData] = await Promise.all([fetchList(), fetchWords()]);
      if (cancelled) return;
      if (listData) setList(listData);
      if (wordsData) setWords(wordsData);
      setNewTitle(`${listData?.name ?? "Liste"} (${toLabel})`);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [listId, fetchList, fetchWords, toLabel]);

  const translateOne = useCallback(
    async (text: string): Promise<string> => {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceLang: toIso6391(fromLang),
          targetLang: toIso6391(toLang),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return text;
      return (data.translation as string)?.trim() ?? text;
    },
    [fromLang, toLang]
  );

  useEffect(() => {
    if (!listId || !list || items.length > 0) return;
    if (words.length === 0) {
      setItems([]);
      setTranslateProgress(null);
      return;
    }
    let cancelled = false;
    setTranslateError(null);
    (async () => {
      const rows: Row[] = [];
      for (let i = 0; i < words.length; i++) {
        if (cancelled) return;
        const w = words[i];
        setTranslateProgress(`${i + 1} / ${words.length}`);
        const [termTranslated, definitionTranslated] = await Promise.all([
          translateOne(w.term),
          translateOne(w.definition),
        ]);
        if (cancelled) return;
        rows.push({
          id: w.id,
          term: w.term,
          definition: w.definition,
          termTranslated,
          definitionTranslated,
        });
      }
      if (!cancelled) {
        setItems(rows);
        setTranslateProgress(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listId, list, words, fromLang, toLang, translateOne]);

  const updateRow = useCallback((id: string, field: "termTranslated" | "definitionTranslated", value: string) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const removeRow = useCallback((id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const save = useCallback(async () => {
    if (!list || items.length === 0) return;
    setSaveError(null);
    setSaving(true);
    try {
      const createRes = await fetch(`/api/familles/${list.familyId}/listes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle.trim() || list.name,
          source: "manual",
          language: toLang,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error((err.error as string) || "Impossible de créer la liste");
      }
      const created = (await createRes.json()) as { id: string };
      const bulkRes = await fetch(`/api/listes/${created.id}/mots/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: items.map((r) => ({
            term: r.termTranslated.trim(),
            definition: r.definitionTranslated.trim(),
          })),
        }),
      });
      if (!bulkRes.ok) {
        const err = await bulkRes.json().catch(() => ({}));
        throw new Error((err.error as string) || "Impossible d’enregistrer les mots");
      }
      router.push(`/app/familles?lang=${encodeURIComponent(toLang)}&saved=1`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }, [list, items, newTitle, toLang, router]);

  if (!listId) {
    return (
      <div className="space-y-6">
        <BackLink href="/app/familles">Retour à la bibliothèque</BackLink>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            Aucune liste sélectionnée. Choisissez une liste depuis la bibliothèque, puis « Dupliquer dans une autre langue ».
          </p>
        </div>
      </div>
    );
  }

  if (loading || !list) {
    return (
      <div className="space-y-6">
        <Link
          href="/app/familles"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
        >
          <span aria-hidden>←</span>
          Retour à la bibliothèque
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">Chargement de la liste…</p>
        </div>
      </div>
    );
  }

  const translating = translateProgress !== null;

  return (
    <div className="space-y-6">
      <BackLink href="/app/familles">Retour à la bibliothèque</BackLink>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Nouvelle liste : {toLabel}
        </h1>

        <div className="mt-4">
          <label htmlFor="new-list-title" className="block text-sm font-medium text-slate-600 dark:text-slate-400">
            Titre de la nouvelle liste
          </label>
          <input
            id="new-list-title"
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            placeholder="Nom de la liste"
          />
        </div>

        {translating && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Traduction en cours… {translateProgress}
          </p>
        )}
        {translateError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {translateError}
          </p>
        )}

        {!translating && words.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Cette liste ne contient aucun mot. Ajoutez des mots à la liste source puis réessayez.
          </p>
        )}

        {items.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="pb-2 pr-2 text-left font-medium text-slate-600 dark:text-slate-400">
                    Terme ({toLabel})
                  </th>
                  <th className="pb-2 pr-2 text-left font-medium text-slate-600 dark:text-slate-400">
                    Définition ({toLabel})
                  </th>
                  <th className="w-10 pb-2 text-right font-medium text-slate-600 dark:text-slate-400">
                    <span className="sr-only">Supprimer</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="text"
                        value={row.termTranslated}
                        onChange={(e) => updateRow(row.id, "termTranslated", e.target.value)}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="text"
                        value={row.definitionTranslated}
                        onChange={(e) => updateRow(row.id, "definitionTranslated", e.target.value)}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </td>
                    <td className="py-2 text-right align-top">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        aria-label="Supprimer cette ligne"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Sauvegarde…" : "Sauvegarder la nouvelle liste"}
            </button>
            {saveError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {saveError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
