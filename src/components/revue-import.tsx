"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { detectListLanguages, KNOWN_LANGUAGE_CODES, toIso6391 } from "@/lib/language";
import { LanguagePill } from "@/app/(app)/app/revision/revision-ui";
import { SaveWordsToListModal } from "@/components/save-words-to-list-modal";
import { saveWordsToExistingList } from "@/lib/vocab-list-save";
import { VOCAB_WORD_FIELD_PROPS } from "@/components/list-name-input";

export type RevueItem = { term: string; definition: string };

export function RevueImport({
  familyId,
  initialItems,
  source,
  defaultLanguage,
  defaultListName,
  targetListId,
  targetListName,
  onSaved,
  onCancel,
}: {
  familyId: string;
  initialItems: RevueItem[];
  source: "pdf" | "ocr";
  /** Langue préférée utilisateur (onboarding) : utilisée si la détection ne donne rien. */
  defaultLanguage?: string | null;
  /** Nom de la liste saisi dans la modale Bibliothèque (évite de redemander en bas). */
  defaultListName?: string | null;
  /** Liste existante choisie en amont : enregistrement direct sans modale de destination. */
  targetListId?: string | null;
  targetListName?: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<RevueItem[]>(initialItems);
  const [index, setIndex] = useState(0);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [directSaving, setDirectSaving] = useState(false);
  const [directSaveError, setDirectSaveError] = useState("");
  const [editing, setEditing] = useState<RevueItem | null>(null);

  const current = items[index];

  const { termLang, defLang } = useMemo(
    () =>
      detectListLanguages(
        items.map((i) => i.term),
        items.map((i) => i.definition)
      ),
    [items]
  );

  /** Pour l’affichage des drapeaux : n’utiliser la détection que si le code a un drapeau connu (fra, eng, etc.), sinon la langue préférée (évite sco → Seychelles au lieu de eng → GB). */
  const displayTermLang =
    (termLang && termLang !== "und" && KNOWN_LANGUAGE_CODES.has(termLang) ? termLang : defaultLanguage) || termLang;
  const displayDefLang =
    (defLang && defLang !== "und" && KNOWN_LANGUAGE_CODES.has(defLang) ? defLang : defaultLanguage) || defLang;

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

  const saveDefaultLanguage =
    (defaultLanguage && KNOWN_LANGUAGE_CODES.has(defaultLanguage)
      ? defaultLanguage
      : termLang && KNOWN_LANGUAGE_CODES.has(termLang)
        ? termLang
        : defaultLanguage) ?? null;

  const handleDirectSave = useCallback(async () => {
    if (!targetListId || items.length === 0) return;
    setDirectSaving(true);
    setDirectSaveError("");
    try {
      await saveWordsToExistingList(targetListId, items);
      onSaved();
      router.refresh();
    } catch (err) {
      setDirectSaveError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setDirectSaving(false);
    }
  }, [targetListId, items, onSaved, router]);

  if (editing) {
    return (
      <div className="rounded-2xl border-[1.5px] border-line bg-surface p-6">
        <h2 className="mb-4 font-medium text-ink">Modifier le mot</h2>
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
      <div className="rounded-2xl border-[1.5px] border-line bg-surface p-6">
        <p className="text-muted">
          Aucun mot à conserver. Vous avez tout supprimé.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted transition hover:opacity-70"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Retour
        </button>
      </div>
    );
  }

  const restCount = items.length - index - 1;

  return (
    <div className="space-y-6 pb-24">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-ink">Trier les mots extraits</h2>
        {(displayTermLang || displayDefLang) && (
          <span className="flex items-center gap-1.5" title="Langues détectées">
            {displayTermLang ? (
              <LanguagePill code={toIso6391(displayTermLang).toUpperCase()} />
            ) : null}
            {displayTermLang && displayDefLang ? (
              <span className="text-xs text-muted" aria-hidden>
                →
              </span>
            ) : null}
            {displayDefLang ? (
              <LanguagePill code={toIso6391(displayDefLang).toUpperCase()} />
            ) : null}
          </span>
        )}
      </div>
      <p className="text-sm text-muted">
        {targetListId
          ? "Conservez, modifiez ou supprimez chaque mot, puis ajoutez-les à votre liste."
          : "Conservez, modifiez ou supprimez chaque mot, puis enregistrez-les dans une liste existante ou créez-en une nouvelle."}
      </p>

      {current ? (
        <div className="mx-auto w-full min-w-0 max-w-md">
          <div className="rounded-2xl border-[1.5px] border-line bg-surface p-6">
            <p className="text-xs text-muted">
              Mot {index + 1} / {items.length}
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">{current.term}</p>
            {current.definition && (
              <p className="mt-1 text-muted">{current.definition}</p>
            )}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={markKeep}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-surface"
                aria-label="Garder"
              >
                Garder
              </button>
              <button
                type="button"
                onClick={openEdit}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-surface px-5 text-sm font-medium text-ink"
                aria-label="Modifier"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={markDiscard}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-false-text"
                aria-label="Supprimer"
              >
                Supprimer
              </button>
            </div>
          </div>
          {index < items.length && restCount > 0 && (
            <button
              type="button"
              onClick={keepAllRest}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink"
              aria-label="Garder tout le reste"
            >
              Garder tout le reste ({restCount} mot{restCount > 1 ? "s" : ""})
            </button>
          )}
        </div>
      ) : (
        <p className="rounded-2xl border-[1.5px] border-line bg-mark/25 px-4 py-3 text-sm text-ink">
          Tous les mots ont été parcourus. Enregistrez votre sélection ci-dessous.
        </p>
      )}

      <div className="rounded-2xl border-[1.5px] border-line bg-surface p-6">
        <h3 className="mb-2 font-medium text-ink">
          {targetListId ? "Ajouter à la liste" : "Enregistrer dans une liste"}
        </h3>
        <p className="mb-4 text-sm text-muted">
          {items.length} mot{items.length !== 1 ? "s" : ""} conservé
          {items.length !== 1 ? "s" : ""}
          {targetListId && targetListName
            ? ` · destination : ${targetListName}`
            : targetListId
              ? "."
              : ". Choisissez une liste existante ou créez-en une nouvelle."}
        </p>
        {directSaveError ? (
          <p className="mb-3 text-sm text-false-text" role="alert">
            {directSaveError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-[20px] border-[1.5px] border-line px-4 py-2 text-ink sm:flex-initial"
          >
            Annuler
          </button>
          {targetListId ? (
            <button
              type="button"
              onClick={() => void handleDirectSave()}
              disabled={items.length === 0 || directSaving}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[20px] px-4 py-2 text-sm font-medium text-surface transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              style={{ background: "var(--ink)" }}
            >
              {directSaving ? "Enregistrement…" : "Ajouter à la liste →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              disabled={items.length === 0}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[20px] px-4 py-2 text-sm font-medium text-surface transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              style={{ background: "var(--ink)" }}
            >
              Enregistrer dans une liste →
            </button>
          )}
        </div>
      </div>

      {!targetListId && (
      <SaveWordsToListModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        words={items}
        defaultFamilyId={familyId}
        defaultNewListName={defaultListName}
        defaultLanguage={saveDefaultLanguage}
        newListSource={source}
        onSaved={() => {
          onSaved();
          router.refresh();
        }}
      />
      )}
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
        <label className="mb-1 block text-sm text-muted">Mot / terme</label>
        <input
          {...VOCAB_WORD_FIELD_PROPS}
          value={t}
          onChange={(e) => setT(e.target.value)}
          className="w-full rounded-xl border-[1.5px] border-line bg-surface px-3 py-2 text-ink"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Traduction / définition</label>
        <input
          {...VOCAB_WORD_FIELD_PROPS}
          name="vocabDefinition"
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="w-full rounded-xl border-[1.5px] border-line bg-surface px-3 py-2 text-ink"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center rounded-[20px] border-[1.5px] border-line px-4 py-2 text-ink"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => onSave(t, d)}
          className="inline-flex min-h-11 items-center rounded-[20px] bg-ink px-4 py-2 text-surface"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
