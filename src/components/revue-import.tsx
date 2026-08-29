"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { detectListLanguages, KNOWN_LANGUAGE_CODES } from "@/lib/language";
import { FlagDisplay } from "@/components/flag-display";
import { SaveWordsToListModal } from "@/components/save-words-to-list-modal";

export type RevueItem = { term: string; definition: string };

export function RevueImport({
  familyId,
  initialItems,
  source,
  defaultLanguage,
  defaultListName,
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
  onSaved: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<RevueItem[]>(initialItems);
  const [index, setIndex] = useState(0);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
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

  if (editing) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <h2 className="mb-4 font-medium text-[var(--foreground)]">
          Modifier le mot
        </h2>
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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <p className="text-[var(--foreground-muted)]">
          Aucun mot à réviser. Tu as tout supprimé.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const restCount = items.length - index - 1;

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Réviser les mots extraits
        </h2>
        {(displayTermLang || displayDefLang) && (
          <span className="flex items-center gap-1 text-xl" title="Langues détectées">
            <FlagDisplay langCode={displayTermLang} size={24} />
            {displayTermLang && displayDefLang && (
              <span className="mx-1 text-[var(--foreground-disabled)]" aria-hidden>→</span>
            )}
            <FlagDisplay langCode={displayDefLang} size={24} />
          </span>
        )}
        {index < items.length && restCount > 0 && (
          <button
            type="button"
            onClick={keepAllRest}
            className="btn-relief ml-auto rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary-dark hover:bg-primary/20"
            aria-label="Garder tout le reste"
          >
            Garder tout le reste ({restCount} fiche{restCount > 1 ? "s" : ""})
          </button>
        )}
      </div>
      <p className="text-sm text-[var(--foreground-muted)]">
        Garde, modifie ou supprime chaque mot. Puis enregistre-les dans une liste existante
        ou crée-en une nouvelle.
      </p>

      {/* Carte type Tinder */}
      {current ? (
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--background-card)] p-6 shadow-lg">
            <p className="text-xs text-[var(--foreground-disabled)]">
              Mot {index + 1} / {items.length}
            </p>
            <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              {current.term}
            </p>
            {current.definition && (
              <p className="mt-1 text-[var(--foreground-muted)]">
                {current.definition}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={markDiscard}
                className="btn-relief rounded-full bg-red-100 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-200"
                aria-label="Supprimer"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={openEdit}
                className="btn-relief rounded-full bg-amber-100 px-5 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
                aria-label="Modifier"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={markKeep}
                className="btn-relief rounded-full bg-primary/20 px-5 py-2.5 text-sm font-medium text-primary-dark hover:bg-primary/30"
                aria-label="Garder"
              >
                Garder
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
          Toutes les fiches ont été parcourues. Enregistre ta sélection ci-dessous.
        </p>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <h3 className="mb-2 font-medium text-[var(--foreground)]">
          Enregistrer dans une liste
        </h3>
        <p className="mb-4 text-sm text-[var(--foreground-muted)]">
          {items.length} mot{items.length !== 1 ? "s" : ""} conservé
          {items.length !== 1 ? "s" : ""}. Choisis une liste existante ou crée-en une
          nouvelle.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => setSaveModalOpen(true)}
            disabled={items.length === 0}
            className="btn-relief rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: "#6C3FC8" }}
          >
            Enregistrer dans une liste →
          </button>
        </div>
      </div>

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
        <label className="mb-1 block text-sm text-[var(--foreground-muted)]">
          Mot / terme
        </label>
        <input
          type="text"
          value={t}
          onChange={(e) => setT(e.target.value)}
          className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--foreground-muted)]">
          Traduction / définition
        </label>
        <input
          type="text"
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => onSave(t, d)}
          className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
