"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RevueImport } from "@/components/revue-import";
import { LanguageOnboardingCard } from "@/components/language-onboarding-card";
import {
  ListNameInput,
  VOCAB_WORD_FIELD_PROPS,
} from "@/components/list-name-input";
import { LanguagePill } from "@/app/(app)/app/revision/revision-ui";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  KNOWN_LANGUAGE_CODES,
  toIso6391,
} from "@/lib/language";
import {
  fetchExistingLists,
  saveWordsToExistingList,
  type VocabListOption,
} from "@/lib/vocab-list-save";
import {
  Pencil,
  FileText,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  Check,
  ChevronLeft,
  X,
} from "lucide-react";

const VIOLET = "var(--ink)";
const SELECT_PURPLE = "#6C3FC8";

function isoLangCode(code: string): string {
  return toIso6391(code).toUpperCase();
}

/** Redimensionne l'image (côté client) pour accélérer envoi et traitement. */
function resizeImage(file: File, maxSize: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxSize && height <= maxSize) {
        resolve(file);
        return;
      }
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type,
        0.9
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

type Method = "manual" | "pdf" | "image" | null;
type DestMode = "create" | "existing";

function languageLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

const PRIMARY_LANGUAGE_OPTIONS = PREFERRED_LANGUAGE_OPTIONS.slice(0, 8);
const EXTRA_LANGUAGE_OPTIONS = PREFERRED_LANGUAGE_OPTIONS.slice(8);

function LanguageStudyPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const [showExtra, setShowExtra] = useState(
    () => EXTRA_LANGUAGE_OPTIONS.some((o) => o.value === value)
  );

  useEffect(() => {
    if (EXTRA_LANGUAGE_OPTIONS.some((o) => o.value === value)) {
      setShowExtra(true);
    }
  }, [value]);

  function renderOption(opt: (typeof PREFERRED_LANGUAGE_OPTIONS)[number]) {
    const selected = value === opt.value;
    return (
      <button
        key={opt.value}
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled}
        onClick={() => onChange(opt.value)}
        className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderColor: selected ? VIOLET : "var(--line)",
          background: selected
            ? "color-mix(in srgb, var(--ink) 8%, var(--surface))"
            : "var(--surface)",
        }}
      >
        <LanguagePill code={isoLangCode(opt.value)} />
        <span
          className="min-w-0 truncate text-sm font-medium"
          style={{ color: selected ? VIOLET : "var(--foreground)" }}
        >
          {opt.label}
        </span>
      </button>
    );
  }

  return (
    <div className="mb-5 min-w-0 w-full">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted">
        Langue étudiée
      </span>
      <div
        className="grid w-full min-w-0 grid-cols-2 gap-2"
        role="listbox"
        aria-label="Langue étudiée"
      >
        {PRIMARY_LANGUAGE_OPTIONS.map(renderOption)}
        {showExtra ? EXTRA_LANGUAGE_OPTIONS.map(renderOption) : null}
      </div>
      {!showExtra && EXTRA_LANGUAGE_OPTIONS.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowExtra(true)}
          disabled={disabled}
          className="mt-2 border-0 bg-transparent p-0 text-left text-sm font-medium text-ink underline-offset-2 hover:underline disabled:opacity-50"
        >
          Autres langues…
        </button>
      ) : null}
    </div>
  );
}

function DestModeSwitch({
  mode,
  onChange,
}: {
  mode: DestMode;
  onChange: (mode: DestMode) => void;
}) {
  return (
    <div
      className="mb-5 flex gap-1 rounded-2xl border-[1.5px] border-line bg-[var(--background-subtle)] p-1"
      role="tablist"
      aria-label="Destination"
    >
      {(
        [
          { id: "create" as const, label: "Nouvelle liste" },
          { id: "existing" as const, label: "Liste existante" },
        ] as const
      ).map(({ id, label }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className="min-h-11 flex-1 rounded-[14px] px-3 text-[13px] font-medium transition-colors"
            style={{
              background: active ? VIOLET : "transparent",
              color: active ? "var(--surface)" : "var(--foreground-muted)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ListRadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]"
      style={{
        borderColor: selected ? SELECT_PURPLE : "var(--line)",
        background: "transparent",
      }}
      aria-hidden
    >
      {selected ? <Check size={12} stroke={SELECT_PURPLE} strokeWidth={3} /> : null}
    </span>
  );
}

function ExistingListPicker({
  catalog,
  selectedId,
  onSelect,
}: {
  catalog: VocabListOption[];
  selectedId: string | null;
  onSelect: (list: VocabListOption) => void;
}) {
  return (
    <ul
      className="mb-5 max-h-[min(40vh,280px)] space-y-2 overflow-y-auto overscroll-contain rounded-2xl border-[1.5px] border-line bg-surface p-2"
      aria-label="Listes existantes"
    >
      {catalog.map((list) => {
        const selected = selectedId === list.id;
        const count = list.wordCount ?? 0;
        return (
          <li key={list.id}>
            <button
              type="button"
              onClick={() => onSelect(list)}
              className="flex w-full min-h-11 items-center gap-3 rounded-xl border-[1.5px] px-3 py-2.5 text-left transition-colors"
              style={{
                borderColor: selected ? SELECT_PURPLE : "transparent",
                background: selected
                  ? "color-mix(in srgb, #6C3FC8 10%, var(--surface))"
                  : "transparent",
              }}
              aria-pressed={selected}
            >
              <ListRadioMark selected={selected} />
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  {list.name}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {list.language ? (
                    <LanguagePill code={isoLangCode(list.language)} />
                  ) : null}
                  <span>
                    {count} mot{count !== 1 ? "s" : ""}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function NouvelleListeFlow({ familyId: familyIdProp }: { familyId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const langFromUrl = searchParams.get("lang")?.trim() || null;
  const listNameFromUrl = searchParams.get("name")?.trim() || null;
  const targetListIdFromUrl = searchParams.get("listId")?.trim() || null;

  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>(langFromUrl ?? "");
  const [savingLang, setSavingLang] = useState(false);
  const [langError, setLangError] = useState<string | null>(null);

  const [destMode, setDestMode] = useState<DestMode>(targetListIdFromUrl ? "existing" : "create");
  const [listName, setListName] = useState(listNameFromUrl ?? "");
  const [catalog, setCatalog] = useState<VocabListOption[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [selectedExisting, setSelectedExisting] = useState<VocabListOption | null>(null);

  const [familyId, setFamilyId] = useState<string | null>(familyIdProp ?? null);
  const [listId, setListId] = useState<string | null>(targetListIdFromUrl);
  const [creatingList, setCreatingList] = useState(false);
  const [setupError, setSetupError] = useState("");

  const [method, setMethod] = useState<Method>(null);
  const [extractedItems, setExtractedItems] = useState<
    Array<{ term: string; definition: string }>
  >([]);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractPhase, setExtractPhase] = useState<"vision" | "ocr" | null>(null);
  const [extractError, setExtractError] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState("");
  const [changingLanguage, setChangingLanguage] = useState(false);

  const needsLanguageStep =
    prefsLoaded && !language && !targetListIdFromUrl && !selectedExisting;

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        const fromList = Array.isArray(data.preferredLanguages)
          ? (data.preferredLanguages[0] as string | undefined)
          : undefined;
        const code = langFromUrl || fromList || data.preferredLanguage || null;
        if (code && KNOWN_LANGUAGE_CODES.has(code)) {
          setPreferredLanguage(code);
          setLanguage((prev) => prev || code);
        }
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, [langFromUrl]);

  useEffect(() => {
    if (targetListIdFromUrl) {
      setCatalogLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (familyIdProp) {
          const [res, bibLists] = await Promise.all([
            fetch(`/api/familles/${familyIdProp}/listes`),
            fetchExistingLists(),
          ]);
          const data = await res.json().catch(() => []);
          const countById = new Map(
            bibLists.map((l) => [l.id, l.wordCount ?? 0])
          );
          if (cancelled || !res.ok || !Array.isArray(data)) {
            if (!cancelled) setCatalogLoaded(true);
            return;
          }
          const options: VocabListOption[] = data.map(
            (l: { id: string; name: string; language?: string | null }) => ({
              id: l.id,
              familyId: familyIdProp,
              name: l.name,
              language: l.language ?? null,
              wordCount: countById.get(l.id) ?? 0,
            })
          );
          if (!cancelled) {
            setCatalog(options);
            const first = options[0] ?? null;
            if (first) {
              setSelectedExisting(first);
              setDestMode("existing");
              setListId(first.id);
              setFamilyId(familyIdProp);
              setListName((prev) => prev || first.name);
              if (first.language) setLanguage((prev) => prev || first.language || "");
            }
            setCatalogLoaded(true);
          }
          return;
        }
        const lists = await fetchExistingLists();
        if (cancelled) return;
        setCatalog(lists);
        setCatalogLoaded(true);
      } catch {
        if (!cancelled) {
          setCatalog([]);
          setCatalogLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [familyIdProp, targetListIdFromUrl]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const addingToExisting = destMode === "existing" && Boolean(listId);
  const effectiveName = addingToExisting
    ? selectedExisting?.name || listNameFromUrl || listName
    : listName;
  const effectiveLanguage = addingToExisting
    ? selectedExisting?.language || language
    : language;

  async function savePreferredLanguage(code: string) {
    setLangError(null);
    setSavingLang(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguages: [code] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = (data.error as string) || "Impossible d'enregistrer la langue.";
        setLangError(data.details ? `${errMsg} (${data.details})` : errMsg);
        return;
      }
      setLanguage(code);
      setPreferredLanguage(code);
    } finally {
      setSavingLang(false);
    }
  }

  async function ensureList(
    source: "manual" | "pdf" | "ocr"
  ): Promise<{ familyId: string; listId: string } | null> {
    if (listId && familyId) {
      if (!addingToExisting) {
        const name = listName.trim();
        const lang = language.trim();
        if (name) {
          await fetch(`/api/listes/${listId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              language: lang || null,
            }),
          });
        }
      }
      return { familyId, listId };
    }
    if (addingToExisting && listId && (familyId || selectedExisting?.familyId)) {
      const fid = familyId || selectedExisting?.familyId;
      if (fid) return { familyId: fid, listId };
    }
    const name = listName.trim();
    if (!name) {
      setSetupError("Donnez un nom à votre liste.");
      return null;
    }
    const lang = language.trim();
    if (!lang) {
      setSetupError("Choisissez une langue.");
      return null;
    }
    setSetupError("");
    setCreatingList(true);
    try {
      const res = await fetch("/api/listes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, source, language: lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.id !== "string" || typeof data.familyId !== "string") {
        setSetupError(
          typeof data.error === "string" ? data.error : "Impossible de créer la liste."
        );
        return null;
      }
      setListId(data.id);
      setFamilyId(data.familyId);
      return { familyId: data.familyId, listId: data.id };
    } catch {
      setSetupError("Erreur réseau. Veuillez réessayer.");
      return null;
    } finally {
      setCreatingList(false);
    }
  }

  const handleFile = useCallback(
    async (
      file: File,
      endpoint: "/api/extract/pdf" | "/api/extract/ocr",
      dest: { familyId: string; listId: string }
    ) => {
      const lang = effectiveLanguage;
      setExtractError("");
      setExtractLoading(true);
      setExtractPhase(endpoint === "/api/extract/ocr" ? "ocr" : null);
      try {
        let fileToSend = file;
        if (endpoint === "/api/extract/ocr" && file.type.startsWith("image/")) {
          fileToSend = await resizeImage(file, 640);
        }
        const formData = new FormData();
        formData.append("file", fileToSend);
        if (endpoint === "/api/extract/ocr" && lang) {
          formData.append("ocrLang", lang);
        }
        const res = await fetch(endpoint, { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setExtractError(data.error ?? "Erreur lors de l’extraction");
          setExtractLoading(false);
          setExtractPhase(null);
          return;
        }
        setFamilyId(dest.familyId);
        setListId(dest.listId);
        setExtractedItems(data.items ?? []);
        setExtractLoading(false);
        setExtractPhase(null);
      } catch {
        setExtractError("Erreur réseau");
        setExtractLoading(false);
        setExtractPhase(null);
      }
    },
    [effectiveLanguage]
  );

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMethod("image");
    setExtractError("");
    setExtractLoading(true);
    setExtractPhase("ocr");
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    void (async () => {
      const dest = await ensureList("ocr");
      if (!dest) {
        setExtractLoading(false);
        setExtractPhase(null);
        setMethod(null);
        setImagePreviewUrl((u) => {
          if (u) URL.revokeObjectURL(u);
          return null;
        });
        return;
      }
      let fileToSend: File = file;
      if (file.type.startsWith("image/")) {
        fileToSend = await resizeImage(file, 640);
      }
      try {
        setOcrProgress("Extraction par IA en cours…");
        const formData = new FormData();
        formData.append("file", fileToSend);
        if (effectiveLanguage) formData.append("ocrLang", effectiveLanguage);
        const res = await fetch("/api/extract/ocr", { method: "POST", body: formData });
        const ocrData = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(ocrData.error ?? "Erreur lors de l'extraction");
        setExtractLoading(false);
        setExtractPhase(null);
        setOcrProgress("");
        setImagePreviewUrl((u) => {
          if (u) URL.revokeObjectURL(u);
          return null;
        });
        const items = ocrData.items ?? [];
        if (items.length > 0) {
          setExtractedItems(items);
        } else {
          setExtractError(
            "Aucune paire mot/traduction trouvée. Utilisez une photo avec une liste claire (ex. une ligne par paire : mot - traduction ou mot : traduction)."
          );
        }
      } catch (err) {
        setExtractLoading(false);
        setExtractPhase(null);
        setOcrProgress("");
        setImagePreviewUrl((u) => {
          if (u) URL.revokeObjectURL(u);
          return null;
        });
        const msg =
          err instanceof Error
            ? err.name === "AbortError"
              ? "Délai dépassé. Réessayez avec une photo plus petite."
              : err.message
            : "Erreur réseau ou extraction.";
        setExtractError(msg);
      }
    })();
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMethod("pdf");
    void (async () => {
      const dest = await ensureList("pdf");
      if (!dest) {
        setMethod(null);
        return;
      }
      await handleFile(file, "/api/extract/pdf", dest);
    })();
  };

  function canStartMethod(): boolean {
    if (addingToExisting && listId) return true;
    if (!listName.trim()) {
      setSetupError("Donnez un nom à votre liste.");
      return false;
    }
    if (!language.trim()) {
      setSetupError("Choisissez une langue.");
      return false;
    }
    return true;
  }

  async function startManual() {
    if (!canStartMethod()) return;
    const dest = await ensureList("manual");
    if (!dest) return;
    setMethod("manual");
  }

  const onSaved = () => {
    router.push("/app/familles");
  };

  const backHref = "/app/familles";

  if (!prefsLoaded || (!catalogLoaded && !targetListIdFromUrl)) {
    return <p className="text-sm text-[var(--foreground-muted)]">Chargement…</p>;
  }

  if (needsLanguageStep) {
    return (
      <LanguageOnboardingCard
        saving={savingLang}
        error={langError}
        onSubmit={savePreferredLanguage}
      />
    );
  }

  if (extractedItems.length > 0 && familyId && listId) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-2xl">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mb-4 inline-flex min-h-11 items-center gap-1 text-muted transition hover:opacity-70"
          style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
        >
          <ChevronLeft size={14} strokeWidth={2} aria-hidden />
          Retour
        </button>
        <RevueImport
          familyId={familyId}
          initialItems={extractedItems}
          source={method === "pdf" ? "pdf" : "ocr"}
          defaultLanguage={effectiveLanguage}
          defaultListName={effectiveName}
          targetListId={listId}
          targetListName={effectiveName}
          onSaved={onSaved}
          onCancel={() => setExtractedItems([])}
        />
      </div>
    );
  }

  const showDestToggle = !targetListIdFromUrl;
  const onExistingStep = destMode === "existing";
  const pageTitle = onExistingStep ? "Ajoutez à une liste" : "Créez votre liste";
  const pageSubtitle = onExistingStep
    ? "Sélectionnez une liste, puis choisissez comment ajouter vos mots."
    : "Nommez votre liste, puis choisissez comment ajouter vos mots.";

  function selectExistingList(list: VocabListOption) {
    setSelectedExisting(list);
    setListId(list.id);
    setFamilyId(list.familyId);
    setListName(list.name);
    if (list.language) setLanguage(list.language);
    setSetupError("");
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-muted transition hover:opacity-70"
        style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
      >
        <ChevronLeft size={14} strokeWidth={2} aria-hidden />
        Retour
      </button>

      {method !== "manual" && (
        <>
          <h1
            className="mb-1 font-medium"
            style={{ fontSize: 20, color: "var(--foreground)" }}
          >
            {pageTitle}
          </h1>
          <p className="mb-6 text-[13px] text-muted">{pageSubtitle}</p>
        </>
      )}

      <input
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        id="pdf-input-nl"
        onChange={handlePdfChange}
        disabled={extractLoading || creatingList}
      />
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="image-input-nl"
        onChange={handleImageChange}
        disabled={extractLoading || creatingList}
      />

      {method === null && (
        <div className="min-w-0 w-full space-y-5">
          {showDestToggle ? (
            <DestModeSwitch
              mode={destMode}
              onChange={(mode) => {
                setDestMode(mode);
                setSetupError("");
                if (mode === "existing" && !selectedExisting && catalog[0]) {
                  selectExistingList(catalog[0]);
                }
                if (mode === "create") {
                  setListId(null);
                  if (!familyIdProp) setFamilyId(null);
                }
              }}
            />
          ) : null}

          {onExistingStep ? (
            catalog.length > 0 ? (
              <ExistingListPicker
                catalog={catalog}
                selectedId={selectedExisting?.id ?? listId}
                onSelect={selectExistingList}
              />
            ) : (
              <div
                className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-8 text-center"
                style={{ borderRadius: 14 }}
              >
                <p className="text-sm text-muted">
                  Vous n&apos;avez pas encore de liste. Créez-en une pour commencer.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDestMode("create");
                    setSetupError("");
                    setListId(null);
                    if (!familyIdProp) setFamilyId(null);
                  }}
                  className="mt-4 inline-flex min-h-11 items-center justify-center px-5 text-sm font-medium text-surface transition hover:brightness-95"
                  style={{ background: VIOLET, borderRadius: 20 }}
                >
                  Créer une nouvelle liste
                </button>
              </div>
            )
          ) : (
            <>
              <LanguageStudyPicker
                value={language}
                onChange={(code) => {
                  setLanguage(code);
                  setSetupError("");
                  setChangingLanguage(true);
                  void (async () => {
                    if (!preferredLanguage) {
                      await savePreferredLanguage(code);
                    }
                    setChangingLanguage(false);
                  })();
                }}
                disabled={changingLanguage || creatingList}
              />

              <div>
                <label
                  htmlFor="nl-list-title"
                  className="mb-1.5 block text-xs font-medium text-muted"
                >
                  Nom de la liste
                </label>
                <ListNameInput
                  id="nl-list-title"
                  value={listName}
                  onChange={(e) => {
                    setListName(e.target.value);
                    setSetupError("");
                  }}
                  placeholder="ex. Chapitre 3 — La Révolution"
                  className="w-full rounded-xl border-[1.5px] border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-ink"
                />
              </div>
            </>
          )}

          {setupError ? (
            <p className="text-sm text-false-text" role="alert">
              {setupError}
            </p>
          ) : null}

          {!(onExistingStep && catalog.length === 0) ? (
            <div className="grid grid-cols-1 gap-3">
              <MethodCard
                iconBg={VIOLET}
                icon={<Pencil size={24} stroke="var(--surface)" strokeWidth={2} />}
                title="Manuel"
                description="Saisissez vos mots un par un."
                disabled={creatingList || changingLanguage}
                onClick={() => void startManual()}
              />
              <MethodCard
                iconBg="var(--mark)"
                icon={<FileText size={24} stroke={VIOLET} strokeWidth={2} />}
                title="PDF"
                description="Importez un document — l'IA extrait les mots automatiquement."
                disabled={creatingList || extractLoading || changingLanguage}
                onClick={() => {
                  if (!canStartMethod()) return;
                  document.getElementById("pdf-input-nl")?.click();
                }}
              />
              <MethodCard
                iconBg="var(--surface)"
                iconBorder="1.5px solid var(--line)"
                icon={<ImageIcon size={24} stroke={VIOLET} strokeWidth={2} />}
                title="Photo ou image"
                description="Prenez une photo ou importez une image — l'IA lit le texte pour vous."
                disabled={creatingList || extractLoading || changingLanguage}
                onClick={() => {
                  if (!canStartMethod()) return;
                  document.getElementById("image-input-nl")?.click();
                }}
              />
            </div>
          ) : null}
        </div>
      )}

      {method === "manual" && familyId && listId && (
        <FormManuel
          familyId={familyId}
          defaultLanguage={effectiveLanguage}
          defaultListName={effectiveName}
          targetListId={listId}
          onBack={() => setMethod(null)}
        />
      )}
      {extractLoading && (
        <div className="mt-8 rounded-2xl border-[1.5px] border-ink bg-surface p-6">
          <div className="flex min-w-0 items-start gap-4">
            {method === "image" && imagePreviewUrl && (
              <div className="flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                <img
                  src={imagePreviewUrl}
                  alt=""
                  className="h-24 w-auto max-w-[160px] object-contain"
                />
              </div>
            )}
            <span
              className="inline-block h-8 w-8 flex-shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)]">
                {method === "image"
                  ? extractPhase === "vision"
                    ? "Extraction par IA en cours…"
                    : "Reconnaissance du texte (OCR) en cours…"
                  : "Extraction en cours…"}
              </p>
              {method === "image" && extractPhase === "ocr" && (
                <>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    {ocrProgress || "Reconnaissance du texte dans le navigateur…"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Cela peut prendre quelques secondes.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {extractError && <p className="mt-4 text-sm text-false-text">{extractError}</p>}
    </div>
  );
}

function FormManuel({
  familyId,
  defaultLanguage,
  defaultListName,
  targetListId,
  onBack,
}: {
  familyId: string;
  defaultLanguage: string | null;
  defaultListName?: string | null;
  targetListId?: string | null;
  onBack: () => void;
}) {
  const router = useRouter();
  const importToExisting = Boolean(targetListId);
  const [existingListId] = useState<string | null>(targetListId ?? null);
  const [listName] = useState(defaultListName ?? "");
  const [listLanguage] = useState(() => defaultLanguage ?? "");
  const [rows, setRows] = useState<Array<{ term: string; definition: string }>>([
    { term: "", definition: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const termRefs = useRef<(HTMLInputElement | null)[]>([]);
  const defRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusNewTermRow = useRef(false);

  function addRow() {
    setRows((r) => [...r, { term: "", definition: "" }]);
  }

  function addRowAndFocusNewTerm() {
    focusNewTermRow.current = true;
    addRow();
  }

  useEffect(() => {
    if (!focusNewTermRow.current) return;
    focusNewTermRow.current = false;
    const idx = rows.length - 1;
    requestAnimationFrame(() => {
      termRefs.current[idx]?.focus();
    });
  }, [rows.length]);

  function handleTermKeyDown(rowIndex: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    defRefs.current[rowIndex]?.focus();
  }

  function handleDefinitionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    addRowAndFocusNewTerm();
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: "term" | "definition", value: string) {
    setRows((r) => {
      const next = [...r];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const words = rows
      .map((r) => ({ term: r.term.trim(), definition: r.definition.trim() }))
      .filter((w) => w.term.length > 0);
    if (words.length === 0) {
      setError("Ajoutez au moins un mot.");
      return;
    }
    setLoading(true);
    try {
      let id = existingListId;
      if (!id) {
        const listRes = await fetch(`/api/familles/${familyId}/listes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: listName.trim() || "Ma liste",
            source: "manual",
            language: listLanguage.trim() || undefined,
          }),
        });
        const listData = await listRes.json().catch(() => ({}));
        if (!listRes.ok) {
          setError(listData.error ?? "Erreur création liste");
          setLoading(false);
          return;
        }
        id = listData.id as string;
      }
      if (!id) {
        setError("Liste introuvable.");
        setLoading(false);
        return;
      }
      await saveWordsToExistingList(id, words);
      const qs = listLanguage.trim()
        ? `?lang=${encodeURIComponent(listLanguage.trim())}`
        : "";
      router.push(`/app/familles${qs}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
      setLoading(false);
    }
  }

  const langLabel = languageLabel(listLanguage);
  const termFieldLabel =
    typeof langLabel === "string"
      ? `Mot en ${langLabel.toLowerCase()}`
      : "Mot (langue de la liste)";
  const definitionFieldLabel = "Traduction en français";

  return (
    <div className="mx-auto flex w-full justify-center px-1 pb-8">
      <form
        onSubmit={handleSubmit}
        className="w-full"
        style={{
          maxWidth: 680,
          background: "var(--surface)",
          borderRadius: 16,
          border: "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
          boxShadow: "0 8px 40px color-mix(in srgb, var(--ink) 10%, transparent)",
          padding: "28px 24px 24px",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="mb-5 flex items-center gap-1 transition hover:opacity-70"
          style={{
            fontSize: 12,
            color: "var(--foreground-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowRight size={13} stroke="currentColor" className="rotate-180" />
          Changer de méthode
        </button>

        <h1
          className="mb-1"
          style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}
        >
          {importToExisting ? "Ajoutez vos mots" : "Saisissez vos mots"}
        </h1>
        <p className="mb-6" style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
          {importToExisting
            ? "Complétez votre liste avec de nouvelles paires mot / traduction."
            : "Ajoutez chaque mot et sa traduction."}
        </p>

        <div
          className="mb-6 inline-flex flex-wrap items-center gap-2.5 rounded-xl border-[1.5px] border-line px-3 py-2.5"
          style={{
            background: "color-mix(in srgb, var(--ink) 6%, transparent)",
          }}
        >
          {listLanguage ? <LanguagePill code={isoLangCode(listLanguage)} /> : null}
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
            {listName || defaultListName || "Nouvelle liste"}
          </span>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--foreground-muted)",
              }}
            >
              Mots
            </span>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 transition hover:opacity-80"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
                minHeight: 44,
              }}
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden />
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  {...VOCAB_WORD_FIELD_PROPS}
                  value={row.term}
                  onChange={(e) => updateRow(i, "term", e.target.value)}
                  placeholder={termFieldLabel}
                  aria-label={termFieldLabel}
                  ref={(el) => {
                    termRefs.current[i] = el;
                  }}
                  className="min-w-0 transition-colors"
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 14,
                    color: "var(--foreground)",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid var(--input-border)",
                    background: "var(--input-bg)",
                    outline: "none",
                    width: "100%",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--ink)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--ink) 12%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onKeyDown={(e) => handleTermKeyDown(i, e)}
                />
                <input
                  {...VOCAB_WORD_FIELD_PROPS}
                  name="vocabDefinition"
                  value={row.definition}
                  onChange={(e) => updateRow(i, "definition", e.target.value)}
                  placeholder={definitionFieldLabel}
                  aria-label={definitionFieldLabel}
                  ref={(el) => {
                    defRefs.current[i] = el;
                  }}
                  className="min-w-0 transition-colors"
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 14,
                    color: "var(--foreground)",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid var(--input-border)",
                    background: "var(--input-bg)",
                    outline: "none",
                    width: "100%",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--ink)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--ink) 12%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onKeyDown={handleDefinitionKeyDown}
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="flex shrink-0 items-center justify-center self-center transition hover:bg-false-bg sm:justify-self-end"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    background: "var(--background-subtle)",
                    color: "var(--foreground-disabled)",
                    cursor: "pointer",
                  }}
                  aria-label="Supprimer la ligne"
                >
                  <X size={16} strokeWidth={2} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-5 text-sm text-false-text" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            className="transition hover:bg-[var(--hover-bg)] sm:min-w-[120px]"
            style={{
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 18px",
              borderRadius: 20,
              border: "1.5px solid var(--border)",
              background: "transparent",
              color: "var(--foreground-muted)",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[180px]"
            style={{
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 18px",
              borderRadius: 20,
              border: "none",
              background: VIOLET,
              color: "var(--surface)",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            {loading
              ? "Enregistrement…"
              : importToExisting
                ? "Ajouter à la liste"
                : "Enregistrer la liste"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MethodCard({
  iconBg,
  iconBorder,
  icon,
  title,
  description,
  onClick,
  disabled = false,
}: {
  iconBg: string;
  iconBorder?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[88px] w-full items-start gap-4 rounded-2xl border-[1.5px] border-line bg-surface p-4 text-left transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[96px] sm:p-5"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ background: iconBg, border: iconBorder }}
      >
        {icon}
      </div>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-sm font-medium text-[var(--foreground)]">{title}</span>
        <span className="mt-1 block text-[13px] leading-snug text-muted">{description}</span>
      </span>
      <ArrowRight
        size={18}
        stroke={VIOLET}
        strokeWidth={2}
        className="mt-3 shrink-0 opacity-70"
        aria-hidden
      />
    </button>
  );
}
