"use client";

import { useState } from "react";
import { Languages, Search, Check } from "lucide-react";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { FlagDisplay } from "@/components/flag-display";

export function LanguageOnboardingCard({
  saving = false,
  error = null,
  onSubmit,
}: {
  saving?: boolean;
  error?: string | null;
  onSubmit: (code: string) => void | Promise<void>;
}) {
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const filtered = PREFERRED_LANGUAGE_OPTIONS.filter(
    (opt) => query === "" || opt.label.toLowerCase().includes(query)
  );

  return (
    <div
      className="flex items-center justify-center px-4 py-8 sm:py-12"
      style={{ minHeight: "min(72vh, calc(100dvh - 140px))" }}
    >
      <div
        className="flex w-full flex-col text-center"
        style={{
          maxWidth: 440,
          maxHeight: "min(92dvh, 720px)",
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid rgba(108, 63, 200, 0.14)",
          boxShadow: "0 8px 40px rgba(108, 63, 200, 0.1)",
          padding: "36px 28px 28px",
        }}
        role="dialog"
        aria-labelledby="onboarding-lang-title"
        aria-describedby="onboarding-lang-desc"
      >
        <div
          className="mx-auto mb-5 flex shrink-0 items-center justify-center"
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

        <h2
          id="onboarding-lang-title"
          className="shrink-0"
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "#1F1235",
            lineHeight: 1.35,
            marginBottom: 8,
          }}
        >
          Quelle langue veux-tu enrichir en vocabulaire ?
        </h2>
        <p
          id="onboarding-lang-desc"
          className="shrink-0"
          style={{
            fontSize: 14,
            color: "var(--foreground-muted)",
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          Choisis une langue dans la liste ci-dessous.
        </p>

        {error && (
          <p
            className="mb-4 shrink-0 text-left text-sm text-red-600"
            role="alert"
            style={{ fontSize: 13 }}
          >
            {error}
          </p>
        )}

        <label htmlFor="onboarding-lang-search" className="sr-only">
          Rechercher une langue
        </label>
        <div className="relative mb-4 w-full shrink-0 text-left">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            size={16}
            strokeWidth={2}
            color="var(--foreground-muted)"
            aria-hidden
          />
          <input
            id="onboarding-lang-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une langue…"
            autoComplete="off"
            className="w-full transition-colors"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 14,
              color: "var(--foreground)",
              padding: "11px 14px 11px 40px",
              borderRadius: 10,
              border: "1.5px solid var(--input-border)",
              background: "var(--input-bg)",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#6C3FC8";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(108, 63, 200, 0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--input-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div
          className="mb-5 min-h-0 flex-1 overflow-y-auto text-left"
          style={{ maxHeight: "min(42vh, 320px)" }}
          role="listbox"
          aria-label="Langues disponibles"
        >
          {filtered.length === 0 ? (
            <p
              className="py-6 text-center"
              style={{ fontSize: 13, color: "var(--foreground-muted)" }}
            >
              Aucune langue ne correspond à ta recherche.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((opt) => {
                const isSelected = selected === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelected(opt.value)}
                    className="relative flex flex-col items-center gap-2 transition-colors"
                    style={{
                      padding: "14px 10px",
                      borderRadius: 10,
                      border: isSelected
                        ? "2px solid #6C3FC8"
                        : "1.5px solid var(--border)",
                      background: isSelected ? "rgba(108, 63, 200, 0.08)" : "#FFFFFF",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(108, 63, 200, 0.05)";
                        e.currentTarget.style.borderColor = "rgba(108, 63, 200, 0.35)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "#FFFFFF";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }
                    }}
                  >
                    {isSelected && (
                      <span
                        className="absolute flex items-center justify-center"
                        style={{
                          top: 6,
                          right: 6,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#6C3FC8",
                        }}
                        aria-hidden
                      >
                        <Check size={11} strokeWidth={3} color="#FFFFFF" />
                      </span>
                    )}
                    <FlagDisplay langCode={opt.value} size={28} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 500 : 400,
                        color: isSelected ? "#6C3FC8" : "var(--foreground)",
                        lineHeight: 1.2,
                        textAlign: "center",
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

        <button
          type="button"
          onClick={() => {
            if (!selected) return;
            void onSubmit(selected);
          }}
          disabled={saving || !selected}
          className="w-full shrink-0 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "#6C3FC8",
            color: "#FFFFFF",
            borderRadius: 10,
            padding: "13px 16px",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          {saving ? "Enregistrement…" : "Valider"}
        </button>
      </div>
    </div>
  );
}
