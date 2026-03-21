"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, LogIn } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.97-6.19a24.01 24.01 0 0 0 0 21.56l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const FEATURE_CHIPS = [
  { emoji: "⚡", label: "SM-2" },
  { emoji: "🐾", label: "Mots sauvages" },
  { emoji: "🔥", label: "Streaks" },
  { emoji: "🌍", label: "Multi-langues" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsRateLimited(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Email ou mot de passe incorrect.");
        setIsRateLimited(res.status === 429);
        setLoading(false);
        return;
      }
      window.location.href = "/app";
    } catch {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        width: "100%",
        maxWidth: 320,
        padding: "26px 22px",
        border: "0.5px solid rgba(108,63,200,0.15)",
      }}
    >
      {/* Logo */}
      <div className="mb-[18px] text-center">
        <Link href="/" className="inline-block no-underline">
          <div
            className="mx-auto mb-2 flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#F0EDF8",
              border: "1.5px solid #DDD6F5",
            }}
          >
            <BookOpen size={26} stroke="#6C3FC8" />
          </div>
          <p style={{ fontSize: 17, fontWeight: 500, color: "#6C3FC8", marginBottom: 2 }}>
            LEXIVA
          </p>
          <p style={{ fontSize: 11, color: "#71717a" }}>
            Apprends le vocabulaire autrement
          </p>
        </Link>
      </div>

      {/* Titre */}
      <p className="mb-4" style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a" }}>
        Bon retour 👋
      </p>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <FieldLabel>Email</FieldLabel>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="ton@email.com"
          className="mb-3 w-full transition-colors"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Mot de passe */}
        <FieldLabel>Mot de passe</FieldLabel>
        <div className="relative mb-1">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full transition-colors"
            style={{ ...inputStyle, paddingRight: 36 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center"
            style={{
              right: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a1a1aa",
            }}
            aria-label={showPassword ? "Masquer" : "Afficher"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <Link
          href="/forgot-password"
          className="mb-3 block text-right no-underline transition hover:opacity-70"
          style={{ fontSize: 11, fontWeight: 500, color: "#6C3FC8", marginTop: 5 }}
        >
          Mot de passe oublié ?
        </Link>

        {/* Erreurs */}
        {error && (
          <p
            className="mb-2 flex items-center gap-1.5"
            style={{
              fontSize: 12,
              color: isRateLimited ? "#d97706" : "#dc2626",
              lineHeight: 1.4,
            }}
          >
            {isRateLimited && <span>⏱️</span>}
            {error}
          </p>
        )}

        {/* Bouton connexion */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-[7px] transition active:scale-[0.98] disabled:opacity-50"
          style={{
            fontSize: 13,
            fontWeight: 500,
            padding: 11,
            borderRadius: 10,
            border: "none",
            background: "#6C3FC8",
            color: "white",
            cursor: "pointer",
            margin: "16px 0 12px",
          }}
        >
          <LogIn size={12} stroke="white" />
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      {/* Séparateur */}
      <div className="mb-[10px] flex items-center gap-[10px]">
        <div className="flex-1" style={{ height: 0.5, background: "#e4e4e7" }} />
        <span style={{ fontSize: 11, color: "#a1a1aa" }}>ou</span>
        <div className="flex-1" style={{ height: 0.5, background: "#e4e4e7" }} />
      </div>

      {/* Google */}
      <button
        type="button"
        className="mb-3.5 flex w-full items-center justify-center gap-2 transition hover:brightness-95"
        style={{
          fontSize: 12,
          padding: 9,
          borderRadius: 10,
          border: "1.5px solid #e4e4e7",
          background: "white",
          color: "#1a1a1a",
          cursor: "pointer",
        }}
      >
        <GoogleIcon />
        Continuer avec Google
      </button>

      {/* Lien signup */}
      <p className="mb-3.5 text-center" style={{ fontSize: 12, color: "#71717a" }}>
        Pas encore de compte ?{" "}
        <Link href="/signup" className="no-underline" style={{ fontWeight: 500, color: "#6C3FC8" }}>
          S&apos;inscrire
        </Link>
      </p>

      {/* Chips features */}
      <div style={{ borderTop: "0.5px solid #e4e4e7", paddingTop: 12 }}>
        <div className="flex flex-wrap justify-center gap-[5px]">
          {FEATURE_CHIPS.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-[3px]"
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: 8,
                background: "#F0EDF8",
                color: "#4B3A9E",
              }}
            >
              {c.emoji} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const inputStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid #e4e4e7",
  background: "#FAFAFA",
  color: "#1a1a1a",
  outline: "none",
  width: "100%",
};

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#6C3FC8";
  e.currentTarget.style.background = "white";
}

function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#e4e4e7";
  e.currentTarget.style.background = "#FAFAFA";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#71717a",
        marginBottom: 5,
      }}
    >
      {children}
    </p>
  );
}
