"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const LANG_OPTIONS: { value: string; label: string }[] = [
  { value: "en", label: "Anglais" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
  { value: "pt", label: "Portugais" },
  { value: "nl", label: "Néerlandais" },
  { value: "pl", label: "Polonais" },
  { value: "ru", label: "Russe" },
  { value: "ja", label: "Japonais" },
  { value: "zh", label: "Chinois" },
];

/** Tesseract utilise des codes 3 lettres pour certaines langues */
const OCR_LANG_MAP: Record<string, string> = {
  en: "eng",
  fr: "fra",
  es: "spa",
  de: "deu",
  it: "ita",
  pt: "por",
  nl: "nld",
  pl: "pol",
  ru: "rus",
  ja: "jpn",
  zh: "chi_sim",
};

type Step = "source" | "langs" | "reading";

type Family = { id: string; name: string };
type List = { id: string; familyId: string; name: string };

export default function MotsSauvagesPage() {
  const [step, setStep] = useState<Step>("source");
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("fr");
  const [bubble, setBubble] = useState<{
    word: string;
    translation: string;
    x: number;
    y: number;
  } | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [listsByFamily, setListsByFamily] = useState<Record<string, List[]>>({});
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isPdf = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const handleFile = useCallback(
    async (file: File) => {
      setExtractError("");
      setExtractLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", isPdf(file) ? "pdf" : "image");
        if (!isPdf(file)) {
          const ocrLang = OCR_LANG_MAP[sourceLang] || sourceLang || "fra+eng";
          formData.append("ocrLang", ocrLang);
        }
        const res = await fetch("/api/extract/raw", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setExtractError(data.error ?? "Erreur extraction");
          setExtractLoading(false);
          return;
        }
        setRawText(typeof data.text === "string" ? data.text : "");
        setStep("langs");
      } catch {
        setExtractError("Erreur réseau");
      } finally {
        setExtractLoading(false);
      }
    },
    [sourceLang]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onWordClick = useCallback(
    async (word: string) => {
      const w = word.trim();
      if (!w) return;
      setTranslateLoading(true);
      setBubble(null);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: w,
            sourceLang,
            targetLang,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setBubble({ word: w, translation: "(erreur)", x: 0, y: 0 });
          return;
        }
        const translation = (data.translation as string) || "(—)";
        setBubble({
          word: w,
          translation,
          x: 0,
          y: 0,
        });
      } catch {
        setBubble({ word: w, translation: "(erreur)", x: 0, y: 0 });
      } finally {
        setTranslateLoading(false);
      }
    },
    [sourceLang, targetLang]
  );

  const openAddModal = useCallback(async () => {
    setAddSuccess(false);
    setAddModalOpen(true);
    try {
      const famRes = await fetch("/api/familles");
      const famData = await famRes.json().catch(() => ({}));
      const famList: Family[] = famRes.ok ? famData : [];
      setFamilies(famList);
      const lists: Record<string, List[]> = {};
      for (const f of famList) {
        const listRes = await fetch(`/api/familles/${f.id}/listes`);
        const listData = await listRes.json().catch(() => ({}));
        lists[f.id] = listRes.ok ? (Array.isArray(listData) ? listData : []) : [];
      }
      setListsByFamily(lists);
    } catch {
      setFamilies([]);
      setListsByFamily({});
    }
  }, []);

  const addToList = useCallback(
    async (listId: string) => {
      if (!bubble) return;
      setAddLoading(true);
      try {
        const res = await fetch(`/api/listes/${listId}/mots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            term: bubble.word,
            definition: bubble.translation,
          }),
        });
        if (res.ok) {
          setAddSuccess(true);
          setTimeout(() => {
            setAddModalOpen(false);
            setBubble(null);
          }, 600);
        }
      } finally {
        setAddLoading(false);
      }
    },
    [bubble]
  );

  // Découper le texte en mots (lettres + apostrophe) et non-mots (espaces, ponctuation)
  const tokens = (() => {
    const text = typeof rawText === "string" ? rawText : "";
    if (!text) return [];
    try {
      return text.match(/\p{L}+(?:'\p{L}+)*|\s+|[^\p{L}\s]+/gu) ?? [];
    } catch {
      return text.split(/(\s+)/);
    }
  })();

  return (
    <div className="space-y-6">
      <Link
        href="/app/familles"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
      >
        <span aria-hidden>←</span>
        Retour à la bibliothèque
      </Link>

      {step === "source" && (
        <>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Mots sauvages
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Envoie un PDF ou une photo du texte. Chaque mot sera cliquable pour
            afficher sa traduction et l’ajouter à une liste.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="btn-relief flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-light">
              <span className="text-3xl" aria-hidden>📄</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                PDF
              </span>
              <span className="text-center text-sm text-slate-500 dark:text-slate-400">
                Importer un fichier PDF
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Choisir un PDF
              </button>
            </label>

            <label className="btn-relief flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-light">
              <span className="text-3xl" aria-hidden>🖼️</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                Importer une photo
              </span>
              <span className="text-center text-sm text-slate-500 dark:text-slate-400">
                Depuis la galerie
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <span className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300">
                Choisir une image
              </span>
            </label>

            <label className="btn-relief flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-light">
              <span className="text-3xl" aria-hidden>📷</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                Prendre une photo
              </span>
              <span className="text-center text-sm text-slate-500 dark:text-slate-400">
                Ouvrir l’appareil photo
              </span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFileChange}
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Prendre une photo
              </button>
            </label>
          </div>

          {extractLoading && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800/50">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Reconnaissance du texte en cours…
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Compte 30 secondes à 1–2 minutes (surtout la première fois : chargement du moteur OCR). Une photo plus petite ou bien cadrée sera plus rapide.
              </p>
            </div>
          )}
          {extractError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {extractError}
            </p>
          )}
        </>
      )}

      {step === "langs" && (
        <>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Langues
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Indique la langue du texte et la langue vers laquelle traduire.
          </p>
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
                Langue du texte
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
                Traduire en
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("source")}
              className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={() => setStep("reading")}
              className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              Afficher le texte
            </button>
          </div>
        </>
      )}

      {step === "reading" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Touche un mot pour voir sa traduction
            </h1>
            <button
              type="button"
              onClick={() => setStep("langs")}
              className="btn-relief rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              Changer les langues
            </button>
          </div>

          <div className="relative rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            {translateLoading && (
              <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                Traduction…
              </p>
            )}
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="leading-relaxed text-slate-800 dark:text-slate-100">
                {tokens.map((token, i) => {
                  const isWord = /^\p{L}/u.test(token);
                  if (isWord) {
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onWordClick(token)}
                        className="rounded px-0.5 py-0.5 font-medium text-primary underline decoration-dotted hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary/20"
                      >
                        {token}
                      </button>
                    );
                  }
                  return <span key={i}>{token}</span>;
                })}
              </p>
            </div>

            {bubble && (
              <div className="mt-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 dark:border-primary/50 dark:bg-primary/10">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-100">
                    {bubble.word}
                  </strong>{" "}
                  → {bubble.translation}
                </p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="btn-relief mt-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Ajouter à une liste
                </button>
              </div>
            )}
          </div>

          {addModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setAddModalOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Ajouter à un groupe de vocabulaire
                </h2>
                {addSuccess ? (
                  <p className="text-primary dark:text-primary-light">
                    ✓ Mot ajouté à la liste.
                  </p>
                ) : families.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Aucune famille. Crée une famille et une liste dans la
                    Bibliothèque d’abord.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {families.map((f) => {
                      const listes = listsByFamily[f.id] ?? [];
                      return (
                        <li key={f.id}>
                          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {f.name}
                          </span>
                          <ul className="ml-3 mt-1 space-y-1">
                            {listes.length === 0 ? (
                              <li className="text-sm text-slate-500 dark:text-slate-400">
                                Aucune liste
                              </li>
                            ) : (
                              listes.map((list) => (
                                <li key={list.id}>
                                  <button
                                    type="button"
                                    onClick={() => addToList(list.id)}
                                    disabled={addLoading}
                                    className="btn-relief rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
                                  >
                                    {list.name}
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
