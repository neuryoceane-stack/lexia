"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_AUDIENCE_LABELS,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENTS_TABLES_MISSING,
  clampAnnouncementMessage,
  messageCounterLabel,
  parseAnnouncementDraft,
  parseAnnouncementList,
  safeAnnouncementLink,
  type AnnouncementAudience,
  type AnnouncementListItem,
  type AnnouncementStatus,
  type AnnouncementType,
  type StudentBanner,
} from "@/lib/announcements";
import { ErrorNote, LoadingNote, cardClass, fieldClass, outlineButtonClass, primaryButtonClass } from "./creator-ui";

type FormState = {
  type: AnnouncementType;
  message: string;
  linkLabel: string;
  linkUrl: string;
  audience: AnnouncementAudience;
  languageCode: string;
  startsAt: string;
  endsAt: string;
  dismissible: boolean;
};

const EMPTY_FORM: FormState = {
  type: "news",
  message: "",
  linkLabel: "",
  linkUrl: "",
  audience: "all",
  languageCode: "",
  startsAt: "",
  endsAt: "",
  dismissible: true,
};

export function AnnouncementsSection() {
  const formId = useId();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [items, setItems] = useState<AnnouncementListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/creator/announcements", { signal });
      const body: unknown = await response.json().catch(() => null);
      if (signal?.aborted) return;
      if (!response.ok) {
        setError(readError(body, "Impossible de charger les annonces."));
        return;
      }
      const parsed = parseAnnouncementList(body);
      if (!parsed) {
        setError("Impossible de charger les annonces.");
        return;
      }
      setItems(parsed);
      setError(null);
    } catch (cause) {
      if (signal?.aborted || (cause instanceof DOMException && cause.name === "AbortError")) return;
      setError("Impossible de charger les annonces.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
  }

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function startEdit(item: AnnouncementListItem) {
    setEditingId(item.id);
    setConfirmId(null);
    setError(null);
    setForm({
      type: item.type,
      message: item.message,
      linkLabel: item.linkLabel ?? "",
      linkUrl: item.linkUrl ?? "",
      audience: item.audience,
      languageCode: item.languageCode ?? "",
      startsAt: item.startsInput,
      endsAt: item.endsInput,
      dismissible: item.dismissible,
    });
    window.requestAnimationFrame(() => {
      messageRef.current?.focus();
      messageRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  async function save(status: AnnouncementStatus) {
    const parsed = parseAnnouncementDraft(draftBody(form, status), new Date());
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        editingId ? `/api/creator/announcements/${editingId}` : "/api/creator/announcements",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftBody(form, status)),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readError(body, "L'annonce n'a pas pu être enregistrée."));
        return;
      }
      resetForm();
      await load();
    } catch {
      setError("L'annonce n'a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(item: AnnouncementListItem, status: AnnouncementStatus) {
    setPendingId(item.id);
    setError(null);
    try {
      const response = await fetch(`/api/creator/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftBody(formFromItem(item), status)),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readError(body, "L'annonce n'a pas pu être mise à jour."));
        return;
      }
      if (editingId === item.id) resetForm();
      await load();
    } catch {
      setError("L'annonce n'a pas pu être mise à jour.");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/creator/announcements/${id}`, { method: "DELETE" });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readError(body, "L'annonce n'a pas pu être supprimée."));
        return;
      }
      setConfirmId(null);
      if (editingId === id) resetForm();
      await load();
    } catch {
      setError("L'annonce n'a pas pu être supprimée.");
    } finally {
      setPendingId(null);
    }
  }

  if (loading && !items) return <LoadingNote>Chargement…</LoadingNote>;
  if (!items) {
    return (
      <div className="space-y-4">
        <ErrorNote>{error ?? "Impossible de charger les annonces."}</ErrorNote>
        {error !== ANNOUNCEMENTS_TABLES_MISSING ? (
          <button type="button" onClick={() => void load()} className={outlineButtonClass}>
            Réessayer
          </button>
        ) : null}
      </div>
    );
  }

  const preview = previewBanner(form);
  const counter = messageCounterLabel([...form.message].length);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[28px] leading-tight text-ink">Annonces</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Un message en haut des pages des élèves. Une seule annonce s&apos;affiche : Important d&apos;abord, puis la plus récente.
        </p>
      </div>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className={`${cardClass} p-5 sm:p-6`}>
          <h3 className="m-0 text-[22px] text-ink">{editingId ? "Modifier l'annonce" : "Nouvelle annonce"}</h3>
          <div className="mt-5 space-y-4">
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">Type</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {ANNOUNCEMENT_TYPES.map((type) => (
                  <Choice
                    key={type}
                    name={`${formId}-type`}
                    checked={form.type === type}
                    onChange={() => updateForm({ type })}
                    label={ANNOUNCEMENT_TYPE_LABELS[type]}
                  />
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={`${formId}-message`} className="mb-1.5 block text-sm font-medium text-ink">
                Message
              </label>
              <textarea
                ref={messageRef}
                id={`${formId}-message`}
                value={form.message}
                onChange={(event) =>
                  updateForm({ message: clampAnnouncementMessage(event.target.value) })
                }
                rows={4}
                aria-describedby={`${formId}-counter`}
                className={`${fieldClass} min-h-28 resize-y py-3`}
              />
              <p id={`${formId}-counter`} className="m-0 mt-1.5 text-xs text-muted">
                {counter}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-link-label`} className="mb-1.5 block text-sm font-medium text-ink">
                  Texte du lien <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input
                  id={`${formId}-link-label`}
                  value={form.linkLabel}
                  onChange={(event) => updateForm({ linkLabel: event.target.value })}
                  maxLength={80}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${formId}-link-url`} className="mb-1.5 block text-sm font-medium text-ink">
                  Adresse du lien <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input
                  id={`${formId}-link-url`}
                  value={form.linkUrl}
                  onChange={(event) => updateForm({ linkUrl: event.target.value })}
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="/app/… ou https://"
                  className={fieldClass}
                />
              </div>
            </div>
            <p className="-mt-2 mb-0 text-xs leading-relaxed text-muted">
              Les deux champs vont ensemble. Seuls un chemin /app/… et une adresse https:// sont acceptés.
            </p>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">Pour qui ?</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ANNOUNCEMENT_AUDIENCES.map((audience) => (
                  <Choice
                    key={audience}
                    name={`${formId}-audience`}
                    checked={form.audience === audience}
                    onChange={() => updateForm({ audience })}
                    label={ANNOUNCEMENT_AUDIENCE_LABELS[audience]}
                  />
                ))}
              </div>
            </fieldset>

            {form.audience === "language" ? (
              <div>
                <label htmlFor={`${formId}-language`} className="mb-1.5 block text-sm font-medium text-ink">
                  Langue
                </label>
                <select
                  id={`${formId}-language`}
                  value={form.languageCode}
                  onChange={(event) => updateForm({ languageCode: event.target.value })}
                  className={fieldClass}
                >
                  <option value="">Choisissez une langue</option>
                  {PREFERRED_LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="m-0 mt-1.5 text-xs text-muted">
                  Visible pour les élèves qui ont au moins une liste dans cette langue.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-start`} className="mb-1.5 block text-sm font-medium text-ink">
                  Début <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input
                  id={`${formId}-start`}
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => updateForm({ startsAt: event.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${formId}-end`} className="mb-1.5 block text-sm font-medium text-ink">
                  Fin <span className="font-normal text-muted">(facultatif)</span>
                </label>
                <input
                  id={`${formId}-end`}
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => updateForm({ endsAt: event.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
            <p className="-mt-2 mb-0 text-xs leading-relaxed text-muted">
              Heure de Paris. L&apos;annonce commence à l&apos;heure de début et s&apos;arrête à l&apos;heure de fin.
            </p>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3">
              <input
                type="checkbox"
                checked={form.dismissible}
                onChange={(event) => updateForm({ dismissible: event.target.checked })}
                className="h-4 w-4 accent-[var(--ink)]"
              />
              <span className="text-sm text-ink">Les élèves peuvent fermer cette annonce</span>
            </label>

            {preview ? (
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Aperçu</p>
                <AnnouncementBanner announcement={preview} preview />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {editingId ? (
                <button type="button" onClick={resetForm} disabled={saving} className={outlineButtonClass}>
                  Annuler
                </button>
              ) : null}
              <button type="button" onClick={() => void save("draft")} disabled={saving} className={outlineButtonClass}>
                Enregistrer le brouillon
              </button>
              <button type="button" onClick={() => void save("published")} disabled={saving} className={primaryButtonClass}>
                {saving ? "Enregistrement…" : "Publier"}
              </button>
            </div>
          </div>
        </section>

        <section className={`${cardClass} p-5 sm:p-6`}>
          <h3 className="m-0 text-[22px] text-ink">Vos annonces</h3>
          {items.length === 0 ? (
            <div className="px-2 py-12 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
                <Megaphone size={22} strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mb-0 mt-4 text-sm text-muted">Aucune annonce pour le moment.</p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-[14px] border border-line px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--background-subtle)] px-2.5 py-0.5 text-xs font-medium text-ink">
                      {item.typeLabel}
                    </span>
                    <PhaseBadge phase={item.phase} label={item.phaseLabel} />
                  </div>
                  <p className="mb-0 mt-3 text-[15px] leading-snug text-ink">{item.message}</p>
                  <p className="mb-0 mt-2 text-sm text-muted">
                    {item.audienceLabel}
                    {" · "}
                    {item.scheduleLabel}
                  </p>
                  {item.linkLabel ? (
                    <p className="mb-0 mt-1 text-sm text-ink">{item.linkLabel}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={pendingId === item.id}
                      className={outlineButtonClass}
                    >
                      Modifier
                    </button>
                    {item.phase === "live" || item.phase === "scheduled" ? (
                      <button
                        type="button"
                        onClick={() => void setStatus(item, "draft")}
                        disabled={pendingId === item.id}
                        className={outlineButtonClass}
                      >
                        Retirer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void setStatus(item, "published")}
                        disabled={pendingId === item.id || item.phase === "ended"}
                        className={outlineButtonClass}
                      >
                        Publier
                      </button>
                    )}
                    {confirmId === item.id ? (
                      <button
                        type="button"
                        onClick={() => void remove(item.id)}
                        disabled={pendingId === item.id}
                        className={outlineButtonClass}
                      >
                        Confirmer la suppression
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(item.id)}
                        disabled={pendingId === item.id}
                        className={outlineButtonClass}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Choice({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-3 text-sm text-ink outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
        checked ? "border-[1.5px] border-ink bg-mark" : "border-line bg-surface"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}

function PhaseBadge({ phase, label }: { phase: AnnouncementListItem["phase"]; label: string }) {
  const className =
    phase === "live"
      ? "bg-just-bg text-just-text"
      : phase === "scheduled"
        ? "border border-ink text-ink"
        : "border border-line text-muted";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}

function draftBody(form: FormState, status: AnnouncementStatus) {
  return {
    type: form.type,
    message: form.message,
    linkLabel: form.linkLabel,
    linkUrl: form.linkUrl,
    audience: form.audience,
    languageCode: form.audience === "language" ? form.languageCode : null,
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    dismissible: form.dismissible,
    status,
  };
}

function formFromItem(item: AnnouncementListItem): FormState {
  return {
    type: item.type,
    message: item.message,
    linkLabel: item.linkLabel ?? "",
    linkUrl: item.linkUrl ?? "",
    audience: item.audience,
    languageCode: item.languageCode ?? "",
    startsAt: item.startsInput,
    endsAt: item.endsInput,
    dismissible: item.dismissible,
  };
}

function previewBanner(form: FormState): StudentBanner | null {
  const message = clampAnnouncementMessage(form.message.replace(/\r\n/g, "\n").trim());
  if (!message) return null;
  const url = form.linkUrl.trim() ? safeAnnouncementLink(form.linkUrl) : null;
  const label = form.linkLabel.trim();
  const linked = Boolean(url && label);
  return {
    id: "preview",
    type: form.type,
    message,
    linkLabel: linked ? label : null,
    linkUrl: linked ? url : null,
    dismissible: form.dismissible,
  };
}

function readError(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return fallback;
}
