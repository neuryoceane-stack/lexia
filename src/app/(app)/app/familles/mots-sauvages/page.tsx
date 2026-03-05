"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

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

type Step = "source" | "langs" | "select" | "reading";

type Family = { id: string; name: string };
type List = { id: string; familyId: string; name: string };

export default function MotsSauvagesPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("source");
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("fr");
  const [bubble, setBubble] = useState<{
    word: string;
    translation: string;
    example: string;
    x: number;
    y: number;
  } | null>(null);
  const [selectedWords, setSelectedWords] = useState<
    Array<{ word: string; translation: string; example: string }>
  >([]);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [listsByFamily, setListsByFamily] = useState<Record<string, List[]>>({});
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addSuccessCount, setAddSuccessCount] = useState(0);
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
          setBubble({ word: w, translation: "(erreur)", example: "", x: 0, y: 0 });
          return;
        }
        const translation = (data.translation as string) || "(—)";
        const example = (data.example as string) ?? "";
        setBubble({
          word: w,
          translation,
          example: typeof example === "string" ? example.trim() : "",
          x: 0,
          y: 0,
        });
      } catch {
        setBubble({ word: w, translation: "(erreur)", example: "", x: 0, y: 0 });
      } finally {
        setTranslateLoading(false);
      }
    },
    [sourceLang, targetLang]
  );

  const openAddModal = useCallback(async (fromBulk?: boolean) => {
    setAddSuccess(false);
    if (fromBulk) {
      setBubble(null);
    }
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
      const wordsToAdd =
        selectedWords.length > 0
          ? selectedWords
          : bubble
            ? [{ word: bubble.word, translation: bubble.translation, example: bubble.example }]
            : [];
      if (wordsToAdd.length === 0) return;
      setAddLoading(true);
      try {
        let successCount = 0;
        for (const w of wordsToAdd) {
          const res = await fetch(`/api/listes/${listId}/mots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              term: w.word,
              definition: w.translation,
            }),
          });
          if (res.ok) successCount += 1;
        }
        if (successCount > 0) {
          setAddSuccessCount(successCount);
          setAddSuccess(true);
          setSelectedWords([]);
          setTimeout(() => {
            setAddModalOpen(false);
            setBubble(null);
          }, 600);
        }
      } finally {
        setAddLoading(false);
      }
    },
    [bubble, selectedWords]
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
      {step === "source" && (
      <button
        type="button"
        onClick={() => router.back()}
        className="btn-relief text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        ← Retour
      </button>
      )}
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
              onClick={() => setStep("select")}
              className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              Afficher le texte
            </button>
          </div>
        </>
      )}

      {step === "select" && (
        <>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Sélectionne la partie à traduire
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Surligne le texte que tu veux garder, ou garde tout
          </p>
          <textarea
            readOnly
            value={rawText}
            className="mb-4 block min-h-[50vh] max-h-[70vh] w-full resize-none overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("langs")}
              className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={() => setStep("reading")}
              className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              Tout garder →
            </button>
            <button
              type="button"
              onClick={() => {
                const selection = typeof window !== "undefined" ? window.getSelection()?.toString().trim() ?? "" : "";
                if (selection) {
                  setRawText(selection);
                  setStep("reading");
                } else {
                  alert("Surligne d'abord une partie du texte");
                }
              }}
              className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              Utiliser ma sélection →
            </button>
          </div>
        </>
      )}

      {step === "reading" && (
        <>
          <div className={selectedWords.length > 0 ? "pb-24" : ""}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Touche un mot pour voir sa traduction
            </h1>
            <button
              type="button"
              onClick={() => setStep("select")}
              className="btn-relief rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              ← Retour
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
                  const isSelected = isWord && selectedWords.some(
                    (sw) => sw.word.toLowerCase() === token.toLowerCase()
                  );
                  if (isWord) {
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onWordClick(token)}
                        className={`rounded px-0.5 py-0.5 font-medium underline decoration-dotted hover:bg-primary/10 dark:hover:bg-primary/20 ${
                          isSelected
                            ? "bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-200"
                            : "text-primary dark:text-primary-light"
                        }`}
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
                {bubble.example && (
                  <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-500">
                    {bubble.example}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWords((prev) => [
                        ...prev,
                        { word: bubble.word, translation: bubble.translation, example: bubble.example },
                      ]);
                      setBubble(null);
                    }}
                    className="btn-relief rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 dark:border-primary-light dark:text-primary-light dark:hover:bg-primary/20"
                  >
                    ＋ Sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddModal()}
                    className="btn-relief rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                  >
                    Ajouter à une liste
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedWords.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => openAddModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary-dark dark:bg-primary-light dark:text-slate-900 dark:hover:bg-primary/90"
              >
                <span>{selectedWords.length} mot{selectedWords.length > 1 ? "s" : ""} sélectionné{selectedWords.length > 1 ? "s" : ""}</span>
                <span>—</span>
                <span>Ajouter tout à une liste →</span>
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
                    ✓ {addSuccessCount > 1 ? `${addSuccessCount} mots ajoutés` : "Mot ajouté à la liste"}.
                  </p>
                ) : (() => {
                  const familiesWithLists = families.filter(
                    (f) => (listsByFamily[f.id] ?? []).length > 0
                  );
                  return familiesWithLists.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Crée d'abord une liste dans ta Bibliothèque
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {familiesWithLists.map((f) => {
                      const listes = listsByFamily[f.id] ?? [];
                      return (
                        <li key={f.id}>
                          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {f.name}
                          </span>
                          <ul className="ml-3 mt-1 space-y-1">
                            {listes.map((list) => (
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
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                  );
                })()}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalOpen(false);
                      router.push("/app/familles");
                    }}
                    className="btn-relief rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 dark:border-primary-light dark:text-primary-light dark:hover:bg-primary/20"
                  >
                    ＋ Créer une nouvelle liste
                  </button>
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
