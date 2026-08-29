"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown, Languages, Loader2, Check, Plus, X, ChevronUp } from "lucide-react";
import { MotsSauvagesSource } from "./mots-sauvages-source";
import { FlagDisplay } from "@/components/flag-display";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  toIso6391,
} from "@/lib/language";
import {
  segmentLangLabel,
  segmentLangsMatch,
  shouldSkipSegmentSelection,
} from "@/lib/parse-claude-segments";
import { parseClaudeTranslationResponse } from "@/lib/parse-claude-translation";
import { compressImage } from "@/lib/image-compression";
import { SaveWordsToListModal } from "@/components/save-words-to-list-modal";

type Step = "source" | "langs" | "select" | "reading";

type TextBlock = {
  id: string;
  texte: string;
  langueDetectee: string;
};

function sourceLangLabel(code: string): string {
  return PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

const WORD_POPOVER_WIDTH = 280;
const VIEWPORT_MARGIN = 12;

type PopoverPlacement = "above" | "below";

type PopoverPosition = {
  x: number;
  y: number;
  placement: PopoverPlacement;
};

function computePopoverPosition(buttonEl: HTMLButtonElement): PopoverPosition {
  const rect = buttonEl.getBoundingClientRect();
  const x = Math.min(
    Math.max(rect.left + rect.width / 2, VIEWPORT_MARGIN + WORD_POPOVER_WIDTH / 2),
    window.innerWidth - VIEWPORT_MARGIN - WORD_POPOVER_WIDTH / 2
  );
  const placement: PopoverPlacement = rect.top < 140 ? "below" : "above";
  const y = placement === "above" ? rect.top : rect.bottom;
  return { x, y, placement };
}

const ACCOUNT_TARGET_LANG = "fra";
const BIBLIOTHEQUE_LANG_STORAGE_KEY = "lexiva.bibliotheque.activeLanguage";

function normalizePreferredLang(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.trim().toLowerCase();
  const normalized = c === "en" ? "eng" : c;
  return PREFERRED_LANGUAGE_OPTIONS.some((o) => o.value === normalized) ? normalized : null;
}

/** Langue du filtre / contexte Bibliothèque (?lang= ou session), jamais la langue du compte. */
function getBibliothequeContextLang(langParam: string | null): string | null {
  const fromUrl = normalizePreferredLang(langParam);
  if (fromUrl) return fromUrl;
  if (typeof window === "undefined") return null;
  try {
    return normalizePreferredLang(
      sessionStorage.getItem(BIBLIOTHEQUE_LANG_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

type SelectedWord = { word: string; translation: string; example: string };

const PICKED_WORD_BG = "rgba(108, 63, 200, 0.28)";

function ReadingSelectionPanel({
  words,
  onRemove,
  onSave,
  className = "",
  listMaxHeight,
  hideSaveButton = false,
}: {
  words: SelectedWord[];
  onRemove: (word: string) => void;
  onSave: () => void;
  className?: string;
  listMaxHeight?: string;
  hideSaveButton?: boolean;
}) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ fontFamily: "DM Sans, sans-serif" }}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1F1235" }}>
          Ta sélection
        </h2>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#6C3FC8" }}>
          {words.length} mot{words.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ maxHeight: listMaxHeight }}
      >
        {words.length === 0 ? (
          <p
            className="rounded-lg px-3 py-4 text-center"
            style={{
              fontSize: 13,
              color: "var(--foreground-muted)",
              background: "rgba(108, 63, 200, 0.05)",
              lineHeight: 1.5,
            }}
          >
            Touche un mot dans le texte, puis ajoute-le avec « + Ajouter ».
          </p>
        ) : (
          <ul className="space-y-2" aria-label="Mots sélectionnés">
            {words.map((sw, idx) => (
              <li
                key={`${sw.word.toLowerCase()}-${idx}`}
                className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: "rgba(108, 63, 200, 0.18)",
                  background: "rgba(108, 63, 200, 0.06)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1F1235",
                      lineHeight: 1.3,
                    }}
                  >
                    {sw.word}
                  </p>
                  <p
                    className="mt-0.5 line-clamp-2"
                    style={{
                      fontSize: 12,
                      color: "#6C3FC8",
                      lineHeight: 1.4,
                    }}
                  >
                    {sw.translation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(sw.word)}
                  className="shrink-0 rounded-md p-1 transition hover:bg-[rgba(108,63,200,0.12)]"
                  aria-label={`Retirer « ${sw.word} » de la sélection`}
                >
                  <X size={16} strokeWidth={2} color="#6C3FC8" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={words.length === 0}
        className={`btn-relief mt-4 w-full shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 ${hideSaveButton ? "hidden" : ""}`}
        style={{ background: "#6C3FC8" }}
      >
        Enregistrer dans une liste →
      </button>
    </div>
  );
}

function StyledLanguageSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label
        htmlFor={id}
        className="mb-2 block text-left"
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--foreground-muted)",
        }}
      >
        {label}
      </label>
      <div className="relative">
        <FlagDisplay
          langCode={value}
          size={20}
          className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2"
        />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer transition-colors"
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--foreground)",
            padding: "11px 40px 11px 44px",
            borderRadius: 10,
            border: "1.5px solid var(--input-border)",
            background: "var(--input-bg)",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#6C3FC8";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(108, 63, 200, 0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {PREFERRED_LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          size={18}
          strokeWidth={2}
          color="var(--foreground-muted)"
          aria-hidden
        />
      </div>
    </div>
  );
}

export default function MotsSauvagesPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("source");
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceLang, setSourceLang] = useState("eng");
  const [targetLang, setTargetLang] = useState(ACCOUNT_TARGET_LANG);
  const defaultSourceLangRef = useRef("eng");
  const defaultTargetLangRef = useRef(ACCOUNT_TARGET_LANG);
  const [bubble, setBubble] = useState<{
    word: string;
    translation: string;
    example: string;
  } | null>(null);
  const [activeTokenIndex, setActiveTokenIndex] = useState<number | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);
  const activeWordButtonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const textScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedWords, setSelectedWords] = useState<
    Array<{ word: string; translation: string; example: string }>
  >([]);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [songInput, setSongInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [songLoading, setSongLoading] = useState(false);
  /** Fichier en cours d'extraction (PDF vs image) — pour le libellé de chargement */
  const [extractKind, setExtractKind] = useState<"pdf" | "image" | null>(null);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(
    () => new Set()
  );
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [segmentFallback, setSegmentFallback] = useState(false);
  const [autoSkippedSelection, setAutoSkippedSelection] = useState(false);
  const [singleLangNotice, setSingleLangNotice] = useState<string | null>(null);
  const [mobileSelectionOpen, setMobileSelectionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const bibliothequeLang = getBibliothequeContextLang(searchParams.get("lang"));
    const sourceDefault = bibliothequeLang ?? "eng";
    const targetDefault = ACCOUNT_TARGET_LANG;

    defaultSourceLangRef.current = sourceDefault;
    defaultTargetLangRef.current = targetDefault;
    setSourceLang(sourceDefault);
    setTargetLang(targetDefault);
  }, [searchParams]);

  const langsConflict = sourceLang === targetLang;

  const applyBibliothequeSourceDefault = useCallback(() => {
    const bibliothequeLang = getBibliothequeContextLang(searchParams.get("lang"));
    const sourceDefault = bibliothequeLang ?? defaultSourceLangRef.current;
    defaultSourceLangRef.current = sourceDefault;
    setSourceLang(sourceDefault);
  }, [searchParams]);

  useEffect(() => {
    setTextBlocks([]);
    setSelectedBlockIds(new Set());
    setSegmentFallback(false);
    setSegmentLoading(false);
    setAutoSkippedSelection(false);
    setSingleLangNotice(null);
  }, [rawText]);

  useEffect(() => {
    if (step !== "select" || segmentFallback || !rawText.trim()) return;
    if (textBlocks.length > 0) return;

    let cancelled = false;

    (async () => {
      setSegmentLoading(true);
      try {
        const res = await fetch("/api/extract/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawText, sourceLang }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok || !Array.isArray(data.blocks) || data.blocks.length === 0) {
          setSegmentFallback(true);
          return;
        }

        const blocks: TextBlock[] = data.blocks
          .map(
            (
              b: {
                texte?: string;
                text?: string;
                langueDetectee?: string;
                langue?: string;
                language?: string;
              },
              i: number
            ) => ({
              id: `block-${i}`,
              texte: String(b.texte ?? b.text ?? "").trim(),
              langueDetectee: String(
                b.langueDetectee ?? b.langue ?? b.language ?? ""
              ).trim(),
            })
          )
          .filter((b: TextBlock) => b.texte.length > 0);

        if (blocks.length === 0) {
          setSegmentFallback(true);
          return;
        }

        if (shouldSkipSegmentSelection(blocks, sourceLang)) {
          setAutoSkippedSelection(true);
          setSingleLangNotice(
            `Texte entièrement en ${sourceLangLabel(sourceLang).toLowerCase()}`
          );
          setStep("reading");
          return;
        }

        setTextBlocks(blocks);
        setSelectedBlockIds(
          new Set(
            blocks
              .filter((b) => segmentLangsMatch(b.langueDetectee, sourceLang))
              .map((b) => b.id)
          )
        );
      } catch {
        if (!cancelled) setSegmentFallback(true);
      } finally {
        if (!cancelled) setSegmentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, rawText, sourceLang, segmentFallback, textBlocks.length]);

  const toggleBlock = useCallback((id: string) => {
    setSelectedBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllBlocks = useCallback(() => {
    setSelectedBlockIds(new Set(textBlocks.map((b) => b.id)));
  }, [textBlocks]);

  const deselectAllBlocks = useCallback(() => {
    setSelectedBlockIds(new Set());
  }, []);

  const applyBlockSelection = useCallback(() => {
    const selected = textBlocks.filter((b) => selectedBlockIds.has(b.id));
    if (selected.length === 0) return;
    setRawText(selected.map((b) => b.texte).join("\n\n"));
    setStep("reading");
  }, [textBlocks, selectedBlockIds]);

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
        applyBibliothequeSourceDefault();
        setStep("langs");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setExtractError(
            "La reconnaissance a pris trop de temps. Réessaie avec une photo plus nette ou mieux cadrée."
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
    [applyBibliothequeSourceDefault]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const repositionPopover = useCallback(() => {
    const el = activeWordButtonRef.current;
    if (!el) return;
    setPopoverPos(computePopoverPosition(el));
  }, []);

  useEffect(() => {
    if (step !== "reading" || activeTokenIndex === null) return;

    repositionPopover();
    const scrollEl = textScrollRef.current;
    scrollEl?.addEventListener("scroll", repositionPopover, { passive: true });
    window.addEventListener("resize", repositionPopover);
    window.addEventListener("scroll", repositionPopover, { passive: true });

    return () => {
      scrollEl?.removeEventListener("scroll", repositionPopover);
      window.removeEventListener("resize", repositionPopover);
      window.removeEventListener("scroll", repositionPopover);
    };
  }, [step, activeTokenIndex, bubble, translateLoading, repositionPopover]);

  useEffect(() => {
    if (step !== "reading" || (!bubble && !translateLoading)) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (textScrollRef.current?.contains(target)) {
        const el = target instanceof Element ? target.closest("button") : null;
        if (el && textScrollRef.current.contains(el)) return;
      }
      setBubble(null);
      setActiveTokenIndex(null);
      setPopoverPos(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [step, bubble, translateLoading]);

  const isWordInSelection = useCallback(
    (word: string) =>
      selectedWords.some((sw) => sw.word.toLowerCase() === word.toLowerCase()),
    [selectedWords]
  );

  const removeWordFromSelection = useCallback((word: string) => {
    const key = word.toLowerCase();
    setSelectedWords((prev) =>
      prev.filter((sw) => sw.word.toLowerCase() !== key)
    );
  }, []);

  const addBubbleWordToSelection = useCallback(() => {
    if (!bubble) return;
    setSelectedWords((prev) => {
      if (prev.some((sw) => sw.word.toLowerCase() === bubble.word.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          word: bubble.word,
          translation: bubble.translation,
          example: bubble.example,
        },
      ];
    });
  }, [bubble]);

  const onWordClick = useCallback(
    async (
      word: string,
      tokenIndex: number,
      buttonEl: HTMLButtonElement
    ) => {
      const w = word.trim();
      if (!w) return;

      activeWordButtonRef.current = buttonEl;
      setActiveTokenIndex(tokenIndex);
      setPopoverPos(computePopoverPosition(buttonEl));

      const existing = selectedWords.find(
        (sw) => sw.word.toLowerCase() === w.toLowerCase()
      );
      if (existing) {
        setBubble({
          word: existing.word,
          translation: existing.translation,
          example: existing.example,
        });
        setTranslateLoading(false);
        return;
      }

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
          setBubble({ word: w, translation: "(erreur)", example: "" });
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
        });
      } catch {
        setBubble({ word: w, translation: "(erreur)", example: "" });
      } finally {
        setTranslateLoading(false);
      }
    },
    [sourceLang, targetLang, selectedWords]
  );

  const openAddModal = useCallback(() => {
    setAddModalOpen(true);
  }, []);

  const handleWordsSaved = useCallback(() => {
    setSelectedWords([]);
    setBubble(null);
    setAddModalOpen(false);
  }, []);

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
      applyBibliothequeSourceDefault();
      setStep("langs");
    } catch {
      setExtractError("Erreur réseau");
    } finally {
      setUrlLoading(false);
    }
  }, [urlInput, applyBibliothequeSourceDefault]);

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
      applyBibliothequeSourceDefault();
      setStep("langs");
    } catch {
      setExtractError("Erreur réseau");
    } finally {
      setSongLoading(false);
    }
  }, [songInput, applyBibliothequeSourceDefault]);

  return (
    <div className="space-y-6">
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
        <div className="flex justify-center px-1 py-2 sm:px-4">
          <div
            className="w-full max-w-[480px] rounded-2xl border bg-white text-center"
            style={{
              borderColor: "var(--border)",
              boxShadow: "0 4px 24px rgba(31, 18, 53, 0.08)",
              padding: "28px 24px 24px",
            }}
          >
            <div
              className="mx-auto mb-5 flex items-center justify-center"
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#EEEDFE",
              }}
              aria-hidden
            >
              <Languages size={26} strokeWidth={2} color="#6C3FC8" />
            </div>

            <h1
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#1F1235",
                lineHeight: 1.35,
                marginBottom: 8,
              }}
            >
              Langues
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--foreground-muted)",
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              Indique la langue du texte et celle vers laquelle tu veux traduire.
            </p>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:gap-2">
              <StyledLanguageSelect
                id="ms-source-lang"
                label="Langue du texte"
                value={sourceLang}
                onChange={setSourceLang}
              />
              <div
                className="flex shrink-0 items-center justify-center sm:pb-3"
                aria-hidden
              >
                <ArrowRight
                  size={20}
                  strokeWidth={2}
                  color="#6C3FC8"
                  className="rotate-90 sm:rotate-0"
                />
              </div>
              <StyledLanguageSelect
                id="ms-target-lang"
                label="Traduire en"
                value={targetLang}
                onChange={setTargetLang}
              />
            </div>

            {langsConflict && (
              <p
                className="mt-4 text-left text-sm"
                role="alert"
                style={{ color: "#B45309" }}
              >
                La langue du texte et la langue de traduction doivent être différentes.
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("source")}
                className="btn-relief w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] sm:w-auto"
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={() => setStep("select")}
                disabled={langsConflict}
                className="btn-relief w-full rounded-lg px-5 py-2.5 text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                style={{ background: "#6C3FC8", fontWeight: 500 }}
              >
                Afficher le texte
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "select" && (
        <div className="flex justify-center px-1 py-2 sm:px-4">
          <div
            className="w-full max-w-[640px] rounded-2xl border bg-white"
            style={{
              borderColor: "var(--border)",
              boxShadow: "0 4px 24px rgba(31, 18, 53, 0.08)",
              padding: "28px 24px 24px",
            }}
          >
            <div
              className="mx-auto mb-5 flex items-center justify-center"
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#EEEDFE",
              }}
              aria-hidden
            >
              <Languages size={26} strokeWidth={2} color="#6C3FC8" />
            </div>

            <h1
              className="text-center"
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#1F1235",
                lineHeight: 1.35,
                marginBottom: 8,
              }}
            >
              Sélectionne la partie à traduire
            </h1>
            <p
              className="text-center"
              style={{
                fontSize: 14,
                color: "var(--foreground-muted)",
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              {segmentFallback
                ? "L'analyse automatique n'a pas abouti — surligne le texte à garder ou conserve tout."
                : `Les passages en ${sourceLangLabel(sourceLang)} sont pré-sélectionnés. Corrige en un clic si besoin.`}
            </p>

            {segmentLoading && (
              <div
                className="mb-5 flex items-center justify-center gap-2 rounded-xl border px-4 py-6"
                style={{
                  borderColor: "rgba(108, 63, 200, 0.25)",
                  background: "rgba(108, 63, 200, 0.05)",
                }}
                role="status"
                aria-live="polite"
              >
                <Loader2
                  size={20}
                  className="animate-spin"
                  color="#6C3FC8"
                  aria-hidden
                />
                <span style={{ fontSize: 14, color: "#4B3A9E" }}>
                  Analyse des passages en cours…
                </span>
              </div>
            )}

            {!segmentLoading && !segmentFallback && textBlocks.length > 0 && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p style={{ fontSize: 12, color: "var(--foreground-muted)" }}>
                    {selectedBlockIds.size} bloc
                    {selectedBlockIds.size !== 1 ? "s" : ""} sélectionné
                    {selectedBlockIds.size !== 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllBlocks}
                      className="transition hover:opacity-80"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#6C3FC8",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Tout cocher
                    </button>
                    <span style={{ color: "var(--border)" }} aria-hidden>
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={deselectAllBlocks}
                      className="transition hover:opacity-80"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--foreground-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Tout décocher
                    </button>
                  </div>
                </div>

                <div
                  className="mb-5 max-h-[min(52vh,420px)] space-y-3 overflow-y-auto pr-1"
                  role="list"
                  aria-label="Passages du texte"
                >
                  {textBlocks.map((block) => {
                    const checked = selectedBlockIds.has(block.id);
                    const isTargetLang = segmentLangsMatch(
                      block.langueDetectee,
                      sourceLang
                    );
                    return (
                      <button
                        key={block.id}
                        type="button"
                        role="listitem"
                        onClick={() => toggleBlock(block.id)}
                        className="flex w-full gap-3 rounded-xl border text-left transition-colors"
                        style={{
                          padding: "14px 14px 14px 12px",
                          borderRadius: 12,
                          border: checked
                            ? "1.5px solid rgba(108, 63, 200, 0.45)"
                            : "1.5px solid var(--border)",
                          background: checked
                            ? "rgba(108, 63, 200, 0.08)"
                            : "var(--background-subtle)",
                          opacity: checked ? 1 : 0.72,
                          cursor: "pointer",
                        }}
                        aria-pressed={checked}
                      >
                        <span
                          className="mt-0.5 flex shrink-0 items-center justify-center"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: checked
                              ? "2px solid #6C3FC8"
                              : "1.5px solid var(--border)",
                            background: checked ? "#6C3FC8" : "#FFFFFF",
                          }}
                          aria-hidden
                        >
                          {checked && (
                            <Check size={14} strokeWidth={3} color="#FFFFFF" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: isTargetLang ? "#6C3FC8" : "var(--foreground-muted)",
                              background: isTargetLang
                                ? "rgba(108, 63, 200, 0.12)"
                                : "rgba(0,0,0,0.04)",
                            }}
                          >
                            <FlagDisplay
                              langCode={block.langueDetectee || sourceLang}
                              size={14}
                            />
                            {segmentLangLabel(block.langueDetectee) || "—"}
                          </span>
                          <span
                            className="block whitespace-pre-wrap leading-relaxed"
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: 14,
                              color: checked
                                ? "var(--foreground)"
                                : "var(--foreground-muted)",
                            }}
                          >
                            {block.texte}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {!segmentLoading && segmentFallback && (
              <textarea
                readOnly
                value={rawText}
                className="mb-5 block min-h-[40vh] max-h-[52vh] w-full resize-none overflow-y-auto rounded-xl border p-4 leading-relaxed"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 14,
                  borderColor: "var(--border)",
                  background: "var(--input-bg)",
                  color: "var(--foreground)",
                }}
                aria-label="Texte extrait complet"
              />
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("langs")}
                className="btn-relief w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] sm:w-auto"
              >
                ← Retour
              </button>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                <button
                  type="button"
                  onClick={() => setStep("reading")}
                  className="btn-relief w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] sm:w-auto"
                >
                  Tout garder →
                </button>
                {!segmentLoading && !segmentFallback && textBlocks.length > 0 ? (
                  <button
                    type="button"
                    onClick={applyBlockSelection}
                    disabled={selectedBlockIds.size === 0}
                    className="btn-relief w-full rounded-lg px-5 py-2.5 text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    style={{ background: "#6C3FC8", fontWeight: 500 }}
                  >
                    Utiliser ma sélection →
                  </button>
                ) : !segmentLoading && segmentFallback ? (
                  <button
                    type="button"
                    onClick={() => {
                      const selection =
                        typeof window !== "undefined"
                          ? window.getSelection()?.toString().trim() ?? ""
                          : "";
                      if (selection) {
                        setRawText(selection);
                        setSourceLang(defaultSourceLangRef.current);
                        setStep("reading");
                      } else {
                        alert("Surligne d'abord une partie du texte");
                      }
                    }}
                    className="btn-relief w-full rounded-lg px-5 py-2.5 text-white transition hover:brightness-95 sm:w-auto"
                    style={{ background: "#6C3FC8", fontWeight: 500 }}
                  >
                    Utiliser ma sélection →
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "reading" && (
        <>
          <div className="lg:flex lg:items-start lg:gap-5">
            <div
              className={`min-w-0 flex-1 ${mobileSelectionOpen ? "pb-[min(52vh,320px)]" : "pb-24"} lg:pb-0`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    color: "var(--foreground)",
                  }}
                >
                  Touche un mot pour voir sa traduction
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setSingleLangNotice(null);
                    setBubble(null);
                    setActiveTokenIndex(null);
                    setPopoverPos(null);
                    setMobileSelectionOpen(false);
                    setStep(autoSkippedSelection ? "langs" : "select");
                  }}
                  className="btn-relief rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  ← Retour
                </button>
              </div>

              {singleLangNotice && (
                <p
                  className="mb-4 rounded-lg px-3 py-2 text-sm"
                  role="status"
                  style={{
                    background: "rgba(108, 63, 200, 0.08)",
                    color: "#4B3A9E",
                    border: "1px solid rgba(108, 63, 200, 0.2)",
                  }}
                >
                  {singleLangNotice}
                </p>
              )}

              <div
                className="rounded-2xl border bg-white p-5 sm:p-6"
                style={{
                  borderColor: "var(--border)",
                  boxShadow: "0 2px 16px rgba(31, 18, 53, 0.06)",
                }}
              >
                <div
                  ref={textScrollRef}
                  className="max-h-[min(62vh,560px)] overflow-y-auto overscroll-contain pr-1 lg:max-h-[min(72vh,640px)]"
                >
                  <p
                    className="text-[var(--foreground)]"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 16,
                      lineHeight: 1.8,
                    }}
                  >
                    {tokens.map((token, i) => {
                      const isWord = /^\p{L}/u.test(token);
                      if (!isWord) {
                        return <span key={i}>{token}</span>;
                      }

                      const isPicked = isWordInSelection(token);
                      const isActive =
                        activeTokenIndex === i &&
                        (translateLoading || bubble !== null);

                      return (
                        <button
                          key={i}
                          ref={
                            isActive
                              ? (el) => {
                                  activeWordButtonRef.current = el;
                                }
                              : undefined
                          }
                          type="button"
                          onClick={(e) =>
                            onWordClick(token, i, e.currentTarget)
                          }
                          className="mx-0.5 inline-flex min-h-[32px] min-w-[28px] items-center justify-center rounded-md px-1 py-1 align-baseline font-medium transition-colors"
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: 16,
                            lineHeight: 1.4,
                            color: isPicked ? "#4B3A9E" : "#6C3FC8",
                            background: isPicked
                              ? PICKED_WORD_BG
                              : isActive
                                ? "rgba(108, 63, 200, 0.12)"
                                : "transparent",
                            boxShadow: isActive
                              ? "0 0 0 2px rgba(108, 63, 200, 0.28)"
                              : undefined,
                            textDecoration: isPicked
                              ? "underline"
                              : "underline dotted",
                            textDecorationColor: isPicked
                              ? "rgba(108, 63, 200, 0.6)"
                              : "rgba(108, 63, 200, 0.45)",
                            textUnderlineOffset: "3px",
                          }}
                          aria-pressed={isPicked}
                          aria-expanded={isActive}
                        >
                          {token}
                        </button>
                      );
                    })}
                  </p>
                </div>
              </div>
            </div>

            <aside
              className="hidden lg:flex lg:w-[min(100%,300px)] lg:shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:flex-col rounded-2xl border bg-white p-4"
              style={{
                borderColor: "var(--border)",
                boxShadow: "0 2px 16px rgba(31, 18, 53, 0.06)",
              }}
              aria-label="Sélection en cours"
            >
              <ReadingSelectionPanel
                words={selectedWords}
                onRemove={removeWordFromSelection}
                onSave={() => openAddModal()}
                className="h-full min-h-[280px] max-h-[calc(100vh-2rem)]"
                listMaxHeight="calc(100vh - 12rem)"
              />
            </aside>
          </div>

          {(translateLoading || bubble) && popoverPos && (
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Traduction du mot"
              className="fixed z-50 rounded-xl border bg-white p-4 shadow-lg"
              style={{
                left: popoverPos.x,
                top: popoverPos.y,
                width: WORD_POPOVER_WIDTH,
                maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
                transform:
                  popoverPos.placement === "above"
                    ? "translate(-50%, calc(-100% - 10px))"
                    : "translate(-50%, 10px)",
                borderColor: "rgba(108, 63, 200, 0.25)",
                boxShadow: "0 8px 32px rgba(31, 18, 53, 0.14)",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <span
                className="pointer-events-none absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border bg-white"
                style={{
                  ...(popoverPos.placement === "above"
                    ? { bottom: -6, borderColor: "rgba(108, 63, 200, 0.25)" }
                    : {
                        top: -6,
                        borderColor: "rgba(108, 63, 200, 0.25)",
                      }),
                  borderTop: "none",
                  borderLeft: "none",
                }}
                aria-hidden
              />

              {translateLoading && !bubble ? (
                <div className="flex items-center justify-center gap-2 py-3">
                  <Loader2
                    size={18}
                    className="animate-spin"
                    color="#6C3FC8"
                    aria-hidden
                  />
                  <span style={{ fontSize: 13, color: "#4B3A9E" }}>
                    Traduction…
                  </span>
                </div>
              ) : bubble ? (
                <>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#1F1235",
                      lineHeight: 1.3,
                    }}
                  >
                    {bubble.word}
                  </p>
                  <p
                    className="mt-2"
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#6C3FC8",
                      lineHeight: 1.4,
                    }}
                  >
                    {bubble.translation}
                  </p>
                  {bubble.example ? (
                    <p
                      className="mt-2 italic"
                      style={{
                        fontSize: 12,
                        color: "var(--foreground-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      « {bubble.example} »
                    </p>
                  ) : null}
                  {isWordInSelection(bubble.word) ? (
                    <button
                      type="button"
                      onClick={() => removeWordFromSelection(bubble.word)}
                      className="btn-relief mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:bg-[rgba(108,63,200,0.06)]"
                      style={{
                        borderColor: "rgba(108, 63, 200, 0.35)",
                        color: "#6C3FC8",
                        background: "rgba(108, 63, 200, 0.08)",
                      }}
                    >
                      <Check size={16} strokeWidth={2.5} aria-hidden />
                      Ajouté — Retirer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={addBubbleWordToSelection}
                      className="btn-relief mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:brightness-95"
                      style={{ background: "#6C3FC8" }}
                    >
                      <Plus size={16} strokeWidth={2.5} aria-hidden />
                      Ajouter
                    </button>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col"
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {mobileSelectionOpen && (
              <div
                className="overflow-hidden rounded-t-2xl border-t border-x bg-white shadow-[0_-8px_32px_rgba(31,18,53,0.12)]"
                style={{ borderColor: "var(--border)", maxHeight: "min(52vh, 320px)" }}
              >
                <div className="overflow-y-auto p-4">
                  <ReadingSelectionPanel
                    words={selectedWords}
                    onRemove={removeWordFromSelection}
                    onSave={() => openAddModal()}
                    listMaxHeight="min(36vh, 240px)"
                    hideSaveButton
                  />
                </div>
              </div>
            )}

            <div
              className="flex items-center gap-2 border-t bg-white px-3 py-2.5"
              style={{
                borderColor: "var(--border)",
                boxShadow: mobileSelectionOpen
                  ? undefined
                  : "0 -4px 20px rgba(31, 18, 53, 0.08)",
              }}
            >
              <button
                type="button"
                onClick={() => setMobileSelectionOpen((o) => !o)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left"
                aria-expanded={mobileSelectionOpen}
              >
                {mobileSelectionOpen ? (
                  <ChevronDown size={18} color="#6C3FC8" aria-hidden />
                ) : (
                  <ChevronUp size={18} color="#6C3FC8" aria-hidden />
                )}
                <span className="min-w-0 truncate" style={{ fontSize: 14, fontWeight: 500, color: "#4B3A9E" }}>
                  {selectedWords.length} mot{selectedWords.length !== 1 ? "s" : ""} ·{" "}
                  {mobileSelectionOpen ? "Masquer" : "Voir la sélection"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => openAddModal()}
                disabled={selectedWords.length === 0}
                className="btn-relief shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: "#6C3FC8" }}
              >
                Enregistrer →
              </button>
            </div>
          </div>

          <SaveWordsToListModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            words={selectedWords.map((w) => ({
              term: w.word,
              definition: w.translation,
            }))}
            defaultLanguage={sourceLang}
            newListSource="manual"
            onSaved={handleWordsSaved}
          />
        </>
      )}
    </div>
  );
}
