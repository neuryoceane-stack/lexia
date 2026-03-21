"use client";

import { useEffect, useId, useState } from "react";
import { Plus, Users, X } from "lucide-react";

const PRIMARY = "#6C3FC8";
const OVERLAY = "rgba(80,60,120,0.18)";
const BORDER_SECONDARY = "var(--border)";
const BORDER_TERTIARY = "#E2DCF5";
const BG_SECONDARY = "var(--background-subtle)";

const QUICK_LANGS = [
  { value: "eng", label: "Anglais", flag: "🇬🇧" },
  { value: "deu", label: "Allemand", flag: "🇩🇪" },
  { value: "spa", label: "Espagnol", flag: "🇪🇸" },
  { value: "ita", label: "Italien", flag: "🇮🇹" },
] as const;

const SCHOOL_LEVELS = [
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "2nde",
  "1ère",
  "Terminale",
  "Prépa",
  "Autre",
] as const;

type LangOption = { value: string; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Après création réussie (liste rafraîchie côté parent). */
  onSuccess: () => void;
  allLanguages: LangOption[];
};

export function CreerClasseModal({
  open,
  onClose,
  onSuccess,
  allLanguages,
}: Props) {
  const dialogLabelId = useId();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("");
  const [schoolLevel, setSchoolLevel] = useState<string>("");
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setLanguage("");
      setSchoolLevel("");
      setShowAllLanguages(false);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleCreate() {
    const t = title.trim();
    if (t.length < 2) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          language: language.trim() || undefined,
          schoolLevel: schoolLevel.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Erreur lors de la création"
        );
        setLoading(false);
        return;
      }
      onClose();
      onSuccess();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const canSubmit = title.trim().length >= 2 && !loading;

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "var(--foreground-muted)",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: OVERLAY }}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogLabelId}
        className="w-full max-w-[400px] overflow-hidden"
        style={{
          background: "white",
          borderRadius: 20,
          border: "0.5px solid rgba(108,63,200,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3"
          style={{
            background: PRIMARY,
            padding: "20px 22px",
          }}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.2)",
            }}
          >
            <Users size={20} stroke="white" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p
              id={dialogLabelId}
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "white",
                margin: 0,
              }}
            >
              Nouvelle classe
            </p>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
                margin: "4px 0 0",
              }}
            >
              Tu recevras un code à partager avec tes élèves
            </p>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex shrink-0 cursor-pointer items-center justify-center border-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
            }}
          >
            <X size={12} stroke="white" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div style={{ padding: "20px 22px" }}>
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-[10px] border px-3 py-2 text-[13px]"
              style={{
                borderColor: "rgba(220,38,38,0.35)",
                background: "rgba(254,226,226,0.35)",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          <label htmlFor="classe-nom" style={labelStyle}>
            Nom de la classe
          </label>
          <input
            id="classe-nom"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex. Anglais 6ème A"
            autoComplete="off"
            className="w-full outline-none transition-colors"
            style={{
              fontSize: 13,
              padding: "10px 13px",
              borderRadius: 10,
              border: `1.5px solid ${BORDER_SECONDARY}`,
              background: BG_SECONDARY,
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = PRIMARY;
              e.target.style.background = "white";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = BORDER_SECONDARY;
              e.target.style.background = BG_SECONDARY;
            }}
          />
          <p
            style={{
              fontSize: 11,
              color: "var(--foreground-muted)",
              marginTop: 5,
              marginBottom: 0,
            }}
          >
            Un nom clair aide tes élèves à identifier leur classe.
          </p>

          <div style={{ marginTop: 18 }}>
            <span style={labelStyle}>Langue enseignée</span>
            <div
              className="grid grid-cols-4"
              style={{ gap: 7 }}
            >
              {QUICK_LANGS.map((l) => {
                const selected = language === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => {
                      setLanguage(l.value);
                      setShowAllLanguages(false);
                    }}
                    className="flex cursor-pointer flex-col items-center border-solid outline-none transition-colors"
                    style={{
                      borderRadius: 10,
                      padding: "8px 4px",
                      gap: 4,
                      border: `1.5px solid ${selected ? PRIMARY : BORDER_TERTIARY}`,
                      background: selected ? "#F0EDF8" : BG_SECONDARY,
                    }}
                  >
                    <span style={{ fontSize: 18 }} aria-hidden>
                      {l.flag}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: selected ? PRIMARY : "var(--foreground-muted)",
                      }}
                    >
                      {l.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {!showAllLanguages ? (
              <button
                type="button"
                onClick={() => setShowAllLanguages(true)}
                className="mt-1 cursor-pointer border-0 bg-transparent p-0 underline"
                style={{ fontSize: 11, color: PRIMARY, marginTop: 4 }}
              >
                Autre langue →
              </button>
            ) : (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-2 w-full cursor-pointer rounded-[10px] border px-2 py-2 text-[13px] outline-none"
                style={{
                  borderColor: BORDER_TERTIARY,
                  background: BG_SECONDARY,
                  color: "var(--foreground)",
                }}
              >
                <option value="">— Choisir une langue —</option>
                {allLanguages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginTop: 18 }}>
            <span style={labelStyle}>Niveau scolaire</span>
            <div className="grid grid-cols-3" style={{ gap: 6 }}>
              {SCHOOL_LEVELS.map((lvl) => {
                const selected = schoolLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSchoolLevel(selected ? "" : lvl)}
                    className="cursor-pointer border-solid text-center outline-none transition-colors"
                    style={{
                      borderRadius: 8,
                      padding: "7px 6px",
                      border: `1.5px solid ${selected ? PRIMARY : BORDER_TERTIARY}`,
                      background: selected ? "#F0EDF8" : BG_SECONDARY,
                      fontSize: 11,
                      fontWeight: 500,
                      color: selected ? PRIMARY : "var(--foreground-muted)",
                    }}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="flex gap-[10px]"
          style={{ padding: "0 22px 20px" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer border-solid"
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: 11,
              borderRadius: 10,
              border: `1.5px solid ${BORDER_SECONDARY}`,
              background: "transparent",
              color: "var(--foreground-muted)",
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleCreate}
            className="flex-[2] cursor-pointer border-0"
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: 11,
              borderRadius: 10,
              background: PRIMARY,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: canSubmit ? 1 : 0.6,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            <Plus size={14} stroke="white" strokeWidth={2} aria-hidden />
            {loading ? "Création…" : "Créer la classe"}
          </button>
        </div>
      </div>
    </div>
  );
}
