"use client";

import { useState, useRef, useCallback } from "react";
import { MotsSauvagesSource } from "./mots-sauvages-source";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  resolvePreferredSourceLangFromText,
  toIso6391,
} from "@/lib/language";
import { parseClaudeTranslationResponse } from "@/lib/parse-claude-translation";
import { compressImage } from "@/lib/image-compression";

type Step = "source" | "langs" | "select" | "reading";

type Family = { id: string; name: string };
type List = { id: string; familyId: string; name: string };

export default function MotsSauvagesPage() {
  const [step, setStep] = useState<Step>("source");
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceLang, setSourceLang] = useState("eng");
  const [targetLang, setTargetLang] = useState("fra");
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createListFamilyId, setCreateListFamilyId] = useState("");
  const [createListName, setCreateListName] = useState("");
  const [createListLoading, setCreateListLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [songInput, setSongInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [songLoading, setSongLoading] = useState(false);
  /** Fichier en cours d'extraction (PDF vs image) — pour le libellé de chargement */
  const [extractKind, setExtractKind] = useState<"pdf" | "image" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isPdf = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const handleFile = useCallback(
    async (file: File) => {
      setExtractError("");
      setExtractKind(isPdf(file) ? "pdf" : "image");
      setExtractLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const fileToSend = isPdf(file) ? file : await compressImage(file);
        const formData = new FormData();
        formData.append("file", fileToSend);
        formData.append("type", isPdf(file) ? "pdf" : "image");
        const res = await fetch("/api/extract/raw", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setExtractError(data.error ?? "Erreur extraction");
          setExtractLoading(false);
          setExtractKind(null);
          return;
        }
        const nextText = typeof data.text === "string" ? data.text : "";
        setRawText(nextText);
        setSourceLang(resolvePreferredSourceLangFromText(nextText, "eng"));
        setStep("langs");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setExtractError(
            "La reconnaissance a pris trop de temps. Réessayez avec une photo plus nette ou mieux cadrée."
          );
        } else {
          setExtractError("Erreur réseau");
        }
      } finally {
        clearTimeout(timeout);
        setExtractLoading(false);
        setExtractKind(null);
      }
    },
    []
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
            sourceLang: toIso6391(sourceLang),
            targetLang: toIso6391(targetLang),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setBubble({ word: w, translation: "(erreur)", example: "", x: 0, y: 0 });
          return;
        }
        const rawT = typeof data.translation === "string" ? data.translation : "";
        const rawE = typeof data.example === "string" ? data.example.trim() : "";
        const parsed = parseClaudeTranslationResponse(rawT);
        const translation =
          parsed.translation.trim() || (rawT.trim() ? rawT.trim() : "(—)");
        const example = rawE || parsed.example.trim();
        setBubble({
          word: w,
          translation,
          example,
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
    setShowCreateForm(false);
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

  const handleCreateListAndAdd = useCallback(async () => {
    const familyId = createListFamilyId || families[0]?.id;
    const name = createListName.trim();
    if (!familyId || !name) return;
    setCreateListLoading(true);
    try {
      const res = await fetch(`/api/familles/${familyId}/listes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Create list error:", data);
        return;
      }
      const newList = data as List;
      setListsByFamily((prev) => ({
        ...prev,
        [familyId]: [...(prev[familyId] ?? []), newList],
      }));
      setShowCreateForm(false);
      setCreateListName("");
      await addToList(newList.id);
    } finally {
      setCreateListLoading(false);
    }
  }, [createListFamilyId, createListName, families, addToList]);

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

  const handleUrlAnalyze = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setUrlLoading(true);
    setExtractError("");
    try {
      const res = await fetch("/api/extract/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExtractError(data.error ?? "Erreur analyse URL");
        return;
      }
      const nextText = typeof data.text === "string" ? data.text : "";
      setRawText(nextText);
      setSourceLang(resolvePreferredSourceLangFromText(nextText, "eng"));
      setStep("langs");
    } catch {
      setExtractError("Erreur réseau");
    } finally {
      setUrlLoading(false);
    }
  }, [urlInput]);

  const handleSongSearch = useCallback(async () => {
    const query = songInput.trim();
    if (!query) return;
    setSongLoading(true);
    setExtractError("");
    try {
      const res = await fetch("/api/extract/song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExtractError(data.error ?? "Erreur recherche chanson");
        return;
      }
      const nextText = typeof data.text === "string" ? data.text : "";
      setRawText(nextText);
      setSourceLang(resolvePreferredSourceLangFromText(nextText, "eng"));
      setStep("langs");
    } catch {
      setExtractError("Erreur réseau");
    } finally {
      setSongLoading(false);
    }
  }, [songInput]);

  return (
    <div className="space-y-6 bg-[var(--background)]">
      {step === "source" && (
        <MotsSauvagesSource
          extractLoading={extractLoading}
          extractKind={extractKind}
          extractError={extractError}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          songInput={songInput}
          setSongInput={setSongInput}
          urlLoading={urlLoading}
          songLoading={songLoading}
          onFileSelect={handleFile}
          onUrlAnalyze={handleUrlAnalyze}
          onSongSearch={handleSongSearch}
          fileInputRef={fileInputRef}
          cameraInputRef={cameraInputRef}
          imageInputRef={imageInputRef}
        />
      )}



      {step === "langs" && (
        <>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Langues
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Indique la langue du texte et la langue vers laquelle traduire.
          </p>
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground-muted)]">
                Langue du texte
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
              >
                {PREFERRED_LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground-muted)]">
                Traduire en
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
              >
                {PREFERRED_LANGUAGE_OPTIONS.map((o) => (
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
              className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
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
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Sélectionne la partie à traduire
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Surligne le texte que tu veux garder, ou garde tout
          </p>
          <textarea
            readOnly
            value={rawText}
            className="mb-4 block min-h-[50vh] max-h-[70vh] w-full resize-none overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4 font-mono text-sm text-[var(--foreground)]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("langs")}
              className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={() => setStep("reading")}
              className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            >
              Tout garder →
            </button>
            <button
              type="button"
              onClick={() => {
                const selection = typeof window !== "undefined" ? window.getSelection()?.toString().trim() ?? "" : "";
                if (selection) {
                  setRawText(selection);
                  setSourceLang(resolvePreferredSourceLangFromText(selection, "eng"));
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
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Touche un mot pour voir sa traduction
            </h1>
            <button
              type="button"
              onClick={() => setStep("select")}
              className="btn-relief rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              ← Retour
            </button>
          </div>

          <div className="relative rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
            {translateLoading && (
              <p className="mb-2 text-sm text-[var(--foreground-muted)]">
                Traduction…
              </p>
            )}
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="leading-relaxed text-[var(--foreground)]">
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
                        className={`rounded px-0.5 py-0.5 font-medium underline decoration-dotted hover:bg-primary/10 ${
                          isSelected
                            ? "bg-green-200 text-green-900"
                            : "text-primary"
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
              <div className="mt-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-[var(--foreground-muted)]">
                  <strong className="text-[var(--foreground)]">
                    {bubble.word}
                  </strong>
                </p>
                <p
                  className="mt-3 text-base font-bold leading-snug"
                  style={{ color: "#6C3FC8" }}
                >
                  {bubble.translation}
                </p>
                {bubble.example ? (
                  <p
                    className="mt-3 border-t border-[var(--border)] pt-3 text-sm italic leading-relaxed"
                    style={{ color: "#94a3b8" }}
                  >
                    — « {bubble.example} »
                  </p>
                ) : null}
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
                    className="btn-relief rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
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
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--background-card)] p-4 shadow-lg">
              <button
                type="button"
                onClick={() => openAddModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary-dark"
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
                className="w-full max-w-md rounded-xl bg-[var(--background-card)] p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                  Ajouter à un groupe de vocabulaire
                </h2>
                {addSuccess ? (
                  <p className="text-primary">
                    ✓ {addSuccessCount > 1 ? `${addSuccessCount} mots ajoutés` : "Mot ajouté à la liste"}.
                  </p>
                ) : showCreateForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--foreground-muted)]">
                        Famille
                      </label>
                      <select
                        value={createListFamilyId || (families[0]?.id ?? "")}
                        onChange={(e) => setCreateListFamilyId(e.target.value)}
                        className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
                      >
                        {families.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--foreground-muted)]">
                        Nom de la liste
                      </label>
                      <input
                        type="text"
                        value={createListName}
                        onChange={(e) => setCreateListName(e.target.value)}
                        placeholder="Ex: Verbes irréguliers"
                        className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setCreateListName("");
                        }}
                        className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateListAndAdd}
                        disabled={createListLoading || !createListName.trim()}
                        className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        {createListLoading ? "Création…" : "Créer et ajouter"}
                      </button>
                    </div>
                  </div>
                ) : (() => {
                  const familiesWithLists = families.filter(
                    (f) => (listsByFamily[f.id] ?? []).length > 0
                  );
                  return familiesWithLists.length === 0 ? (
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Crée d'abord une liste dans ta Bibliothèque
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {familiesWithLists.map((f) => {
                      const listes = listsByFamily[f.id] ?? [];
                      return (
                        <li key={f.id}>
                          <span className="block text-sm font-medium text-[var(--foreground)]">
                            {f.name}
                          </span>
                          <ul className="ml-3 mt-1 space-y-1">
                            {listes.map((list) => (
                                <li key={list.id}>
                                  <button
                                    type="button"
                                    onClick={() => addToList(list.id)}
                                    disabled={addLoading}
                                    className="btn-relief rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-subtle)]"
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
                      setCreateListFamilyId(families[0]?.id ?? "");
                      setCreateListName("");
                      setShowCreateForm(true);
                    }}
                    className="btn-relief rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                  >
                    ＋ Créer une nouvelle liste
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
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
