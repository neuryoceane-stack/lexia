"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { getSafeAppCallbackUrl } from "@/lib/safe-callback-url";

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
  const searchParams = useSearchParams();

  const callbackRaw = searchParams.get("callbackUrl");
  const safeCallback = getSafeAppCallbackUrl(callbackRaw);
  const signupHref =
    callbackRaw && safeCallback !== "/app"
      ? `/signup?callbackUrl=${encodeURIComponent(safeCallback)}`
      : "/signup";

  useEffect(() => {
    const param = searchParams.get("email");
    if (param?.trim()) setEmail(param.trim().toLowerCase());
  }, [searchParams]);

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
      window.location.href = safeCallback;
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
          <Image
            src="/logo-mark.png"
            alt="Lexiva"
            width={52}
            height={52}
            className="mx-auto mb-2"
            style={{ objectFit: "contain" }}
          />
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

      {/* Lien signup */}
      <p className="mb-3.5 mt-4 text-center" style={{ fontSize: 12, color: "#71717a" }}>
        Pas encore de compte ?{" "}
        <Link href={signupHref} className="no-underline" style={{ fontWeight: 500, color: "#6C3FC8" }}>
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
