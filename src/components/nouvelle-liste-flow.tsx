"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { RevueImport } from "@/components/revue-import";
import { FlagDisplay } from "@/components/flag-display";
import { LanguageOnboardingCard } from "@/components/language-onboarding-card";
import { ListNameInput } from "@/components/list-name-input";
import { PREFERRED_LANGUAGE_OPTIONS, KNOWN_LANGUAGE_CODES } from "@/lib/language";
import {
  fetchExistingLists,
  saveWordsToExistingList,
  type VocabListOption,
} from "@/lib/vocab-list-save";
import {
  Pencil,
  FileText,
  Image as ImageIcon,
  Upload,
  Camera,
  Plus,
  ArrowRight,
  X,
} from "lucide-react";

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

function LanguageRecap({
  code,
  onChange,
}: {
  code: string;
  onChange?: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = languageLabel(code) ?? code;
  return (
    <div className="mb-5">
      <span
        className="mb-2 block"
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--foreground-muted)",
        }}
      >
        Langue
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex items-center gap-2.5"
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1.5px solid rgba(108, 63, 200, 0.2)",
            background: "rgba(108, 63, 200, 0.06)",
          }}
        >
          <FlagDisplay langCode={code} size={22} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#4B3A9E" }}>{label}</span>
        </div>
        {onChange && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="transition hover:opacity-80"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#6C3FC8",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 4px",
              minHeight: 44,
            }}
          >
            {open ? "Fermer" : "Changer"}
          </button>
        )}
      </div>
      {open && onChange && (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {PREFERRED_LANGUAGE_OPTIONS.map((opt) => {
            const sel = code === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex flex-col items-center gap-0.5"
                style={{
                  borderRadius: 10,
                  padding: "6px 3px",
                  border: `1.5px solid ${sel ? "#6C3FC8" : "var(--border)"}`,
                  background: sel ? "rgba(108, 63, 200, 0.08)" : "var(--background-subtle)",
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                <FlagDisplay langCode={opt.value} size={16} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: sel ? "#6C3FC8" : "var(--foreground-muted)",
                  }}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
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
          const res = await fetch(`/api/familles/${familyIdProp}/listes`);
          const data = await res.json().catch(() => []);
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
      setSetupError("Donne un nom à ta liste.");
      return null;
    }
    const lang = language.trim();
    if (!lang) {
      setSetupError("Choisis une langue.");
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
      setSetupError("Erreur réseau. Réessaie.");
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
            "Aucune paire mot/traduction trouvée. Utilise une photo avec une liste claire (ex. une ligne par paire : mot - traduction ou mot : traduction)."
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
              ? "Délai dépassé. Réessaie avec une photo plus petite."
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
      setSetupError("Donne un nom à ta liste.");
      return false;
    }
    if (!language.trim()) {
      setSetupError("Choisis une langue.");
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
      <div>
        <BackLink href={backHref} />
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

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="mb-4 flex items-center gap-1 text-[var(--foreground-muted)] transition hover:opacity-70"
        style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
      >
        <ArrowRight size={13} stroke="currentColor" className="rotate-180" />
        Retour
      </button>

      {method !== "manual" && (
        <>
          <h1 className="mb-1" style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>
            {addingToExisting ? "Comment veux-tu ajouter tes mots ?" : "Crée ta liste"}
          </h1>
          <p className="mb-6" style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
            {addingToExisting
              ? "Choisis un mode pour compléter ta liste."
              : "Nomme-la, puis choisis comment ajouter tes mots."}
          </p>
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
        <div className="space-y-5">
          {catalog.length > 0 && !familyIdProp && !targetListIdFromUrl && (
            <div
              className="flex gap-1.5"
              role="tablist"
              aria-label="Destination de l'import"
            >
              <button
                type="button"
                role="tab"
                aria-selected={destMode === "create"}
                onClick={() => {
                  setDestMode("create");
                  setSetupError("");
                }}
                className="flex-1 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors sm:px-3 sm:py-2.5"
                style={{
                  background: destMode === "create" ? "#6C3FC8" : "var(--background-subtle)",
                  color: destMode === "create" ? "white" : "var(--foreground-muted)",
                  minHeight: 44,
                }}
              >
                Nouvelle liste
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={destMode === "existing"}
                onClick={() => {
                  setDestMode("existing");
                  setSetupError("");
                  if (!selectedExisting && catalog[0]) {
                    setSelectedExisting(catalog[0]);
                    setListId(catalog[0].id);
                    setFamilyId(catalog[0].familyId);
                    if (catalog[0].language) setLanguage(catalog[0].language);
                  }
                }}
                className="flex-1 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors sm:px-3 sm:py-2.5"
                style={{
                  background: destMode === "existing" ? "#6C3FC8" : "var(--background-subtle)",
                  color: destMode === "existing" ? "white" : "var(--foreground-muted)",
                  minHeight: 44,
                }}
              >
                Liste existante
              </button>
            </div>
          )}

          {destMode === "existing" && catalog.length > 0 ? (
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--foreground-muted)",
                  marginBottom: 6,
                }}
              >
                Liste de destination
              </p>
              <ul
                className="max-h-[min(28vh,168px)] space-y-1 overflow-y-auto overscroll-contain sm:max-h-[min(40vh,240px)]"
                aria-label="Listes existantes"
              >
                {catalog.map((list) => {
                  const selected = selectedExisting?.id === list.id;
                  return (
                    <li key={list.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExisting(list);
                          setListId(list.id);
                          setFamilyId(list.familyId);
                          setListName(list.name);
                          if (list.language) setLanguage(list.language);
                          setSetupError("");
                        }}
                        className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left"
                        style={{
                          borderColor: selected ? "#6C3FC8" : "var(--border)",
                          background: selected
                            ? "rgba(108, 63, 200, 0.1)"
                            : "var(--background-card)",
                          minHeight: 44,
                          cursor: "pointer",
                        }}
                        aria-pressed={selected}
                      >
                        {list.language ? <FlagDisplay langCode={list.language} size={16} /> : null}
                        <span
                          className="min-w-0 flex-1 text-sm font-medium"
                          style={{ color: selected ? "#4B3A9E" : "var(--foreground)" }}
                        >
                          {list.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <>
              {effectiveLanguage ? (
                <LanguageRecap
                  code={effectiveLanguage}
                  onChange={
                    !addingToExisting
                      ? (code) => {
                          setLanguage(code);
                          setChangingLanguage(true);
                          void (async () => {
                            if (!preferredLanguage) {
                              await savePreferredLanguage(code);
                            }
                            setChangingLanguage(false);
                          })();
                        }
                      : undefined
                  }
                />
              ) : null}

              <div>
                <label
                  htmlFor="nl-list-title"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--foreground-muted)",
                    marginBottom: 6,
                    display: "block",
                  }}
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
                  className="w-full transition-colors"
                  style={{
                    fontSize: 13,
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid var(--input-border)",
                    background: "var(--input-bg)",
                    color: "var(--foreground)",
                    outline: "none",
                    width: "100%",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6C3FC8";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                  }}
                />
              </div>
            </>
          )}

          {setupError && (
            <p className="text-sm text-red-600" role="alert">
              {setupError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MethodCard
              bg="var(--background-subtle)"
              border="#C4B5F4"
              hoverBorder="#6C3FC8"
              iconBg="#6C3FC8"
              icon={<Pencil size={22} stroke="white" />}
              decoColor="#6C3FC8"
              title="Manuel"
              description="Saisis tes mots un par un."
              btnBg="#6C3FC8"
              btnIcon={<Plus size={11} stroke="white" />}
              btnLabel="Commencer"
              arrowBg="#DDD6F5"
              arrowColor="#6C3FC8"
              disabled={creatingList || changingLanguage}
              onClick={() => void startManual()}
            />
            <MethodCard
              bg="var(--background-card)"
              border="var(--border)"
              hoverBorder="#F5A623"
              iconBg="#F5A623"
              icon={<FileText size={22} stroke="white" />}
              decoColor="#F5A623"
              title="PDF"
              description="Importe un document — l'IA extrait les mots automatiquement."
              btnBg="#6C3FC8"
              btnIcon={<Upload size={11} stroke="white" />}
              btnLabel="Importer"
              arrowBg="#FAE5B0"
              arrowColor="#F5A623"
              disabled={creatingList || extractLoading || changingLanguage}
              onClick={() => {
                if (!canStartMethod()) return;
                document.getElementById("pdf-input-nl")?.click();
              }}
            />
            <MethodCard
              bg="var(--background-card)"
              border="var(--border)"
              hoverBorder="#1D9E75"
              iconBg="#1D9E75"
              icon={<ImageIcon size={22} stroke="white" />}
              decoColor="#1D9E75"
              title="Photo ou image"
              description="Prends une photo ou importe une image — l'IA lit le texte pour toi."
              btnBg="#6C3FC8"
              btnIcon={<Camera size={11} stroke="white" />}
              btnLabel="Choisir"
              arrowBg="#C3E6D6"
              arrowColor="#1D9E75"
              disabled={creatingList || extractLoading || changingLanguage}
              onClick={() => {
                if (!canStartMethod()) return;
                document.getElementById("image-input-nl")?.click();
              }}
            />
          </div>
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
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] p-6">
          <div className="flex items-start gap-4">
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
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  {ocrProgress || "Reconnaissance du texte dans le navigateur…"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {extractError && <p className="mt-4 text-sm text-red-600">{extractError}</p>}
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
      setError("Ajoute au moins un mot.");
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
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid rgba(108, 63, 200, 0.14)",
          boxShadow: "0 8px 40px rgba(108, 63, 200, 0.1)",
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
          style={{ fontSize: 20, fontWeight: 500, color: "#1F1235", lineHeight: 1.3 }}
        >
          {importToExisting ? "Ajoute tes mots" : "Saisis tes mots"}
        </h1>
        <p className="mb-6" style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
          {importToExisting
            ? "Complète ta liste avec de nouvelles paires mot / traduction."
            : "Ajoute chaque mot et sa traduction."}
        </p>

        <div
          className="mb-6 inline-flex flex-wrap items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(108, 63, 200, 0.06)",
            border: "1.5px solid rgba(108, 63, 200, 0.16)",
          }}
        >
          {listLanguage ? <FlagDisplay langCode={listLanguage} size={22} /> : null}
          <span style={{ fontSize: 14, fontWeight: 500, color: "#4B3A9E" }}>
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
                color: "#6C3FC8",
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
                  type="text"
                  value={row.term}
                  onChange={(e) => updateRow(i, "term", e.target.value)}
                  placeholder={termFieldLabel}
                  aria-label={termFieldLabel}
                  ref={(el) => {
                    termRefs.current[i] = el;
                  }}
                  className="min-w-0 transition-colors"
                  style={{
                    fontFamily: "DM Sans, sans-serif",
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
                    e.currentTarget.style.borderColor = "#6C3FC8";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(108, 63, 200, 0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onKeyDown={(e) => handleTermKeyDown(i, e)}
                />
                <input
                  type="text"
                  value={row.definition}
                  onChange={(e) => updateRow(i, "definition", e.target.value)}
                  placeholder={definitionFieldLabel}
                  aria-label={definitionFieldLabel}
                  ref={(el) => {
                    defRefs.current[i] = el;
                  }}
                  className="min-w-0 transition-colors"
                  style={{
                    fontFamily: "DM Sans, sans-serif",
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
                    e.currentTarget.style.borderColor = "#6C3FC8";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(108, 63, 200, 0.12)";
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
                  className="flex shrink-0 items-center justify-center self-center transition hover:bg-red-50 sm:justify-self-end"
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
          <p className="mt-5 text-sm text-red-600" role="alert">
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
              borderRadius: 10,
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
              borderRadius: 10,
              border: "none",
              background: "#6C3FC8",
              color: "#FFFFFF",
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
  bg,
  border,
  hoverBorder,
  iconBg,
  icon,
  decoColor,
  title,
  description,
  btnBg,
  btnIcon,
  btnLabel,
  arrowBg,
  arrowColor,
  onClick,
  disabled = false,
}: {
  bg: string;
  border: string;
  hoverBorder: string;
  iconBg: string;
  icon: React.ReactNode;
  decoColor: string;
  title: string;
  description: string;
  btnBg: string;
  btnIcon: React.ReactNode;
  btnLabel: string;
  arrowBg: string;
  arrowColor: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex flex-col overflow-hidden text-left card-hover disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 16,
        padding: "20px 16px 16px",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = hoverBorder;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = border;
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: 48, height: 48, borderRadius: "50%", background: iconBg, marginBottom: 14 }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", marginBottom: 5 }}>
        {title}
      </p>
      <p style={{ fontSize: 12, color: "var(--foreground-muted)", flex: 1, marginBottom: 18 }}>
        {description}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-[5px]"
          style={{
            background: btnBg,
            color: "white",
            borderRadius: 20,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {btnIcon}
          {btnLabel}
        </span>
        <span
          className="flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: "50%", background: arrowBg }}
        >
          <ArrowRight size={12} stroke={arrowColor} />
        </span>
      </div>
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: -20,
          right: -20,
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: decoColor,
          opacity: 0.1,
        }}
      />
    </button>
  );
}
