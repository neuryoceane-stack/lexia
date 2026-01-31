"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Family = { id: string; name: string };
type List = { id: string; name: string; familyId: string };
type DueWord = {
  id: string;
  listId: string;
  term: string;
  definition: string;
};

type Scope = { type: "family"; familyId: string } | { type: "list"; listId: string; familyId: string };
type Mode = "flashcard" | "write";

function normalizeForCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function RevisionClient() {
  const [step, setStep] = useState<"scope" | "mode" | "session">("scope");
  const [families, setFamilies] = useState<Family[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  const [words, setWords] = useState<DueWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [writeAnswer, setWriteAnswer] = useState("");
  const [writeResult, setWriteResult] = useState<"correct" | "wrong" | null>(null);
  const [writeRevealed, setWriteRevealed] = useState(false);
  const [laterWords, setLaterWords] = useState<DueWord[]>([]);
  const [isRetryRound, setIsRetryRound] = useState(false);

  const current = words[index];

  const loadFamilies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/familles");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur chargement familles");
        return;
      }
      setFamilies(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === "scope") loadFamilies();
  }, [step, loadFamilies]);

  async function loadLists(familyId: string) {
    setError("");
    try {
      const res = await fetch(`/api/familles/${familyId}/listes`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur chargement listes");
        return;
      }
      setLists(Array.isArray(data) ? data : []);
      setSelectedFamilyId(familyId);
    } catch {
      setError("Erreur réseau");
    }
  }

  function selectScope(s: Scope) {
    setScope(s);
    setStep("mode");
  }

  function selectMode(m: Mode) {
    setMode(m);
    setStep("session");
    loadSessionWords();
  }

  const loadSessionWords = useCallback(async () => {
    if (!scope) return;
    setLoading(true);
    setError("");
    try {
      const url =
        scope.type === "list"
          ? `/api/revision?listId=${encodeURIComponent(scope.listId)}`
          : `/api/revision?familyId=${encodeURIComponent(scope.familyId)}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur chargement des mots");
        setWords([]);
        return;
      }
      setWords(data.words ?? []);
      setLaterWords([]);
      setIndex(0);
      setRevealed(false);
      setWriteAnswer("");
      setWriteResult(null);
      setWriteRevealed(false);
      setIsRetryRound(false);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  async function recordReview(success: boolean) {
    if (!current || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: current.id, success }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement");
        setSending(false);
        return;
      }
      setWords((prev) => prev.filter((w) => w.id !== current.id));
      setRevealed(false);
      setIndex(0);
      setWriteAnswer("");
      setWriteResult(null);
      setWriteRevealed(false);
    } finally {
      setSending(false);
    }
  }

  function submitWriteAnswer() {
    if (!current) return;
    const ok =
      normalizeForCompare(writeAnswer) === normalizeForCompare(current.definition);
    setWriteResult(ok ? "correct" : "wrong");
    setWriteRevealed(false);
    if (ok) {
      recordReview(true);
    }
  }

  function onWrongReveal() {
    setWriteRevealed(true);
  }

  function onWrongLater() {
    if (!current) return;
    setLaterWords((prev) => [...prev, current]);
    setWords((prev) => prev.filter((w) => w.id !== current.id));
    setIndex(0);
    setWriteAnswer("");
    setWriteResult(null);
    setWriteRevealed(false);
  }

  function onWrongRetry() {
    setWriteResult(null);
    setWriteRevealed(false);
    setWriteAnswer("");
  }

  function onWrongNext() {
    if (!current) return;
    recordReview(false);
  }

  useEffect(() => {
    if (step === "session" && mode === "write" && words.length === 0 && laterWords.length > 0) {
      setWords(laterWords);
      setLaterWords([]);
      setIsRetryRound(true);
    }
  }, [step, mode, words.length, laterWords.length]);

  function backToScope() {
    setStep("scope");
    setSelectedFamilyId(null);
    setLists([]);
    setScope(null);
    setMode(null);
    setWords([]);
    setError("");
  }

  function backToMode() {
    setStep("mode");
    setWords([]);
    setError("");
  }

  if (step === "scope") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choisis une famille, puis une liste (ou toute la famille) à réviser.
        </p>
        {error && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}
        {loading && !selectedFamilyId ? (
          <p className="text-slate-500 dark:text-slate-400">
            Chargement des familles…
          </p>
        ) : (
          <div className="space-y-4">
            <section>
              <h2 className="mb-2 font-medium text-slate-800 dark:text-slate-100">
                Famille
              </h2>
              <ul className="flex flex-wrap gap-2">
                {families.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => loadLists(f.id)}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        selectedFamilyId === f.id
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      {f.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            {selectedFamilyId && (
              <section>
                <h2 className="mb-2 font-medium text-slate-800 dark:text-slate-100">
                  Liste à réviser
                </h2>
                <ul className="flex flex-wrap gap-2">
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        selectScope({
                          type: "family",
                          familyId: selectedFamilyId,
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-emerald-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-600"
                    >
                      Toute la famille
                    </button>
                  </li>
                  {lists.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() =>
                          selectScope({
                            type: "list",
                            listId: l.id,
                            familyId: selectedFamilyId,
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-emerald-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-600"
                      >
                        {l.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {families.length === 0 && !loading && (
              <p className="text-slate-500 dark:text-slate-400">
                Aucune famille.{" "}
                <Link href="/app/familles" className="text-emerald-600 dark:text-emerald-400">
                  Créer une famille
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (step === "mode") {
    const scopeLabel =
      scope?.type === "family"
        ? "toute la famille"
        : lists.find((l) => l.id === scope?.listId)?.name ?? "cette liste";
    return (
      <div className="space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tu as choisi : <strong>{scopeLabel}</strong>. Comment veux-tu réviser ?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectMode("flashcard")}
            className="rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-emerald-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-emerald-500"
          >
            <span className="text-2xl" aria-hidden>🃏</span>
            <h3 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
              Flashcards
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              On affiche le mot, tu cliques pour voir la réponse, puis tu indiques si tu savais ou non.
            </p>
          </button>
          <button
            type="button"
            onClick={() => selectMode("write")}
            className="rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-emerald-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-emerald-500"
          >
            <span className="text-2xl" aria-hidden>✏️</span>
            <h3 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
              Écrire la réponse
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              On affiche le mot, tu écris la traduction ou la définition, puis on vérifie.
            </p>
          </button>
        </div>
        <button
          type="button"
          onClick={backToScope}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Changer de famille ou liste
        </button>
      </div>
    );
  }

  if (step === "session") {
    if (loading && words.length === 0) {
      return (
        <p className="text-slate-500 dark:text-slate-400">
          Chargement des mots à réviser…
        </p>
      );
    }
    if (error && words.length === 0) {
      return (
        <div className="space-y-4">
          <p className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={loadSessionWords}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={backToMode}
            className="ml-3 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
          >
            Changer de mode
          </button>
        </div>
      );
    }
    if (words.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            Aucune fiche à réviser pour ce périmètre.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Reviens plus tard ou choisis une autre liste / famille.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={backToMode}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              Changer de mode
            </button>
            <button
              type="button"
              onClick={backToScope}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Choisir une autre famille ou liste
            </button>
          </div>
        </div>
      );
    }

    if (mode === "flashcard") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {words.length} fiche{words.length > 1 ? "s" : ""} — Flashcards. Clique sur la carte pour afficher la réponse.
            </p>
            <button
              type="button"
              onClick={backToMode}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Changer de mode
            </button>
          </div>
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white p-8 text-left shadow-lg transition hover:border-emerald-300 hover:shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:hover:border-emerald-600"
            >
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {words.length} mot{words.length > 1 ? "s" : ""} restant{words.length > 1 ? "s" : ""}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                {current.term}
              </p>
              {revealed && (
                <p className="mt-4 border-t border-slate-200 pt-4 text-slate-600 dark:border-slate-600 dark:text-slate-400">
                  {current.definition || "—"}
                </p>
              )}
              {!revealed && (
                <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                  Clique pour afficher la réponse
                </p>
              )}
            </button>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => recordReview(false)}
                disabled={sending || !revealed}
                className="rounded-full bg-red-100 px-6 py-3 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              >
                Je ne savais pas
              </button>
              <button
                type="button"
                onClick={() => recordReview(true)}
                disabled={sending || !revealed}
                className="rounded-full bg-emerald-100 px-6 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
              >
                Je savais
              </button>
            </div>
            {!revealed && (
              <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                Affiche la réponse avant de noter la fiche.
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {words.length} fiche{words.length > 1 ? "s" : ""} — Écris la réponse.
            </p>
            <button
              type="button"
              onClick={backToMode}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Changer de mode
            </button>
          </div>
          {isRetryRound && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              Mots mis de côté : à revoir maintenant.
            </p>
          )}
        </div>
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-lg dark:border-slate-600 dark:bg-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {words.length} mot{words.length > 1 ? "s" : ""} restant{words.length > 1 ? "s" : ""}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {current.term}
            </p>
            <div className="mt-6">
              <label htmlFor="write-answer" className="mb-2 block text-sm text-slate-600 dark:text-slate-400">
                Ta réponse (traduction ou définition)
              </label>
              <input
                id="write-answer"
                type="text"
                value={writeAnswer}
                onChange={(e) => setWriteAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitWriteAnswer()}
                placeholder="Écris ici…"
                disabled={sending}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                autoFocus
              />
            </div>
            {writeResult === "correct" && (
              <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-200">
                <p>Correct.</p>
              </div>
            )}
            {writeResult === "wrong" && (
              <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200">
                <p className="font-medium">Faux.</p>
                {writeRevealed ? (
                  <p className="mt-2">
                    Réponse attendue : <strong>{current.definition || "—"}</strong>
                  </p>
                ) : null}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {writeResult === null && (
              <button
                type="button"
                onClick={submitWriteAnswer}
                disabled={sending || !writeAnswer.trim()}
                className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Valider
              </button>
            )}
            {writeResult === "wrong" && !writeRevealed && (
              <>
                <button
                  type="button"
                  onClick={onWrongRetry}
                  className="rounded-full bg-emerald-100 px-6 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                >
                  Réessayer
                </button>
                <button
                  type="button"
                  onClick={onWrongReveal}
                  className="rounded-full border-2 border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  Révéler
                </button>
                <button
                  type="button"
                  onClick={onWrongLater}
                  className="rounded-full bg-amber-100 px-6 py-3 text-sm font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                >
                  Plus tard
                </button>
              </>
            )}
            {writeResult === "wrong" && writeRevealed && (
              <button
                type="button"
                onClick={onWrongNext}
                disabled={sending}
                className="rounded-full bg-slate-700 px-8 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-700"
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
