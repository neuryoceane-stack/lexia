"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Check } from "lucide-react";
import { AppModal } from "@/components/app-modal";
import { ListNameInput } from "@/components/list-name-input";
import { FlagDisplay } from "@/components/flag-display";
import {
  KNOWN_LANGUAGE_CODES,
  PREFERRED_LANGUAGE_OPTIONS,
} from "@/lib/language";

export type SaveWordItem = {
  term: string;
  definition: string;
};

type VocabList = { id: string; familyId: string; name: string };

type SaveMode = "existing" | "create";

export type SaveWordsToListModalProps = {
  open: boolean;
  onClose: () => void;
  words: SaveWordItem[];
  /** Appelé uniquement après enregistrement réussi */
  onSaved: (info: { count: number }) => void;
  defaultLanguage?: string | null;
  /** @deprecated Conservé pour compatibilité — ignoré (modèle 1:1) */
  defaultFamilyId?: string | null;
  defaultNewListName?: string | null;
  newListSource?: "manual" | "ocr" | "pdf";
};

async function fetchExistingLists(): Promise<VocabList[]> {
  const res = await fetch("/api/bibliotheque?sort=alpha");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.lists)) return [];
  return data.lists.map(
    (l: { id: string; familyId: string; name: string }) => ({
      id: l.id,
      familyId: l.familyId,
      name: l.name,
    })
  );
}

export function SaveWordsToListModal({
  open,
  onClose,
  words,
  onSaved,
  defaultLanguage = null,
  defaultNewListName = null,
  newListSource = "manual",
}: SaveWordsToListModalProps) {
  const wordCount = words.length;

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [existingLists, setExistingLists] = useState<VocabList[]>([]);
  const [mode, setMode] = useState<SaveMode>("existing");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createLanguage, setCreateLanguage] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [error, setError] = useState("");

  const normalizedWords = useMemo(
    () =>
      words
        .map((w) => ({
          term: w.term.trim(),
          definition: w.definition.trim(),
        }))
        .filter((w) => w.term.length > 0),
    [words]
  );

  const sortedLists = useMemo(
    () =>
      [...existingLists].sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      ),
    [existingLists]
  );

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setError("");
    try {
      const lists = await fetchExistingLists();
      setExistingLists(lists);
      setMode(lists.length > 0 ? "existing" : "create");
    } catch {
      setExistingLists([]);
      setMode("create");
      setError("Impossible de charger tes listes. Réessaie ou crée une nouvelle liste.");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSuccess(false);
    setSuccessCount(0);
    setError("");
    setSelectedListId(null);
    setCreateName(defaultNewListName ?? "");
    setCreateLanguage(
      defaultLanguage && KNOWN_LANGUAGE_CODES.has(defaultLanguage)
        ? defaultLanguage
        : PREFERRED_LANGUAGE_OPTIONS[0]?.value ?? "fra"
    );
    void loadCatalog();
  }, [open, defaultNewListName, defaultLanguage, loadCatalog]);

  const canSave =
    normalizedWords.length > 0 &&
    !loadingCatalog &&
    !saving &&
    !success &&
    (mode === "existing"
      ? selectedListId !== null
      : createName.trim().length > 0);

  const saveToExistingList = useCallback(
    async (listId: string) => {
      const res = await fetch(`/api/listes/${listId}/mots/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: normalizedWords }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Erreur lors de l'enregistrement"
        );
      }
      return typeof data.count === "number" ? data.count : normalizedWords.length;
    },
    [normalizedWords]
  );

  const handleConfirmSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      let listId = selectedListId;
      if (mode === "create") {
        const res = await fetch("/api/listes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: createName.trim(),
            source: newListSource,
            language: createLanguage.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Erreur création de la liste"
          );
        }
        listId = typeof data.id === "string" ? data.id : null;
        if (!listId) throw new Error("Liste créée mais identifiant manquant");
      }

      if (!listId) return;

      const count = await saveToExistingList(listId);
      setSuccessCount(count);
      setSuccess(true);
      window.setTimeout(() => {
        onSaved({ count });
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    mode,
    selectedListId,
    createName,
    createLanguage,
    newListSource,
    saveToExistingList,
    onSaved,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [saving, onClose]);

  const modeTabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-[#6C3FC8] text-white"
        : "bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:bg-[rgba(108,63,200,0.08)]"
    }`;

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      closeOnOverlay={!saving && !success}
      title="Enregistrer dans une liste"
      titleId="save-words-modal-title"
    >
      <p
        className="-mt-2 mb-4 text-sm"
        style={{ color: "var(--foreground-muted)", fontFamily: "DM Sans, sans-serif" }}
      >
        {wordCount} mot{wordCount !== 1 ? "s" : ""} à enregistrer — choisis une destination,
        puis valide.
      </p>

      {success ? (
        <div
          className="flex flex-col items-center gap-3 rounded-xl px-4 py-8 text-center"
          style={{
            background: "rgba(108, 63, 200, 0.08)",
            border: "1px solid rgba(108, 63, 200, 0.2)",
          }}
          role="status"
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "#6C3FC8" }}
            aria-hidden
          >
            <Check size={24} strokeWidth={2.5} color="#FFFFFF" />
          </span>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1F1235" }}>
            {successCount} mot{successCount !== 1 ? "s" : ""} enregistré
            {successCount !== 1 ? "s" : ""} !
          </p>
        </div>
      ) : loadingCatalog ? (
        <div
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-10"
          style={{
            background: "rgba(108, 63, 200, 0.05)",
            border: "1px solid rgba(108, 63, 200, 0.15)",
          }}
          role="status"
          aria-live="polite"
        >
          <Loader2 size={20} className="animate-spin" color="#6C3FC8" aria-hidden />
          <span style={{ fontSize: 14, color: "#4B3A9E" }}>
            Chargement de tes listes…
          </span>
        </div>
      ) : (
        <>
          <div
            className="mb-4 flex gap-2"
            role="tablist"
            aria-label="Mode d'enregistrement"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "existing"}
              className={modeTabClass(mode === "existing")}
              onClick={() => {
                setMode("existing");
                setError("");
              }}
              disabled={sortedLists.length === 0}
            >
              Liste existante
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "create"}
              className={modeTabClass(mode === "create")}
              onClick={() => {
                setMode("create");
                setError("");
              }}
            >
              Nouvelle liste
            </button>
          </div>

          {mode === "existing" ? (
            <div className="max-h-[min(40vh,280px)] overflow-y-auto overscroll-contain pr-1">
              {sortedLists.length === 0 ? (
                <p className="rounded-lg px-3 py-4 text-sm text-[var(--foreground-muted)]">
                  Tu n&apos;as pas encore de liste. Passe à « Nouvelle liste » pour en
                  créer une.
                </p>
              ) : (
                <ul className="space-y-1.5" aria-label="Listes existantes">
                  {sortedLists.map((list) => {
                    const selected = selectedListId === list.id;
                    return (
                      <li key={list.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedListId(list.id);
                            setError("");
                          }}
                          className="w-full rounded-xl border px-3 py-2.5 text-left transition-colors"
                          style={{
                            borderColor: selected ? "#6C3FC8" : "var(--border)",
                            background: selected
                              ? "rgba(108, 63, 200, 0.1)"
                              : "var(--background-card)",
                            boxShadow: selected
                              ? "0 0 0 1px rgba(108, 63, 200, 0.25)"
                              : undefined,
                          }}
                          aria-pressed={selected}
                        >
                          <span
                            className="block text-sm font-medium"
                            style={{
                              color: selected ? "#4B3A9E" : "var(--foreground)",
                            }}
                          >
                            {list.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="save-words-list-title"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]"
                >
                  Nom de la liste
                </label>
                <ListNameInput
                  id="save-words-list-title"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="ex. Chapitre 3 — Le corps"
                  className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)]"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  Langue
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {PREFERRED_LANGUAGE_OPTIONS.map((opt) => {
                    const selected = createLanguage === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCreateLanguage(opt.value)}
                        className="flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-colors"
                        style={{
                          borderColor: selected ? "#6C3FC8" : "var(--border)",
                          background: selected
                            ? "rgba(108, 63, 200, 0.08)"
                            : "transparent",
                        }}
                        aria-pressed={selected}
                      >
                        <FlagDisplay langCode={opt.value} size={18} />
                        <span
                          className="text-center leading-tight"
                          style={{
                            fontSize: 9,
                            fontWeight: selected ? 600 : 500,
                            color: selected ? "#6C3FC8" : "var(--foreground-muted)",
                          }}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={!canSave}
              className="btn-relief inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ background: "#6C3FC8" }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Enregistrement…
                </>
              ) : (
                <>
                  Enregistrer {normalizedWords.length} mot
                  {normalizedWords.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </AppModal>
  );
}
