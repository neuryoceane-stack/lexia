"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  Eye,
  EyeOff,
  Flame,
  Languages,
  LogIn,
  PawPrint,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { getSafeAppCallbackUrl } from "@/lib/safe-callback-url";
import { Logo } from "@/components/logo";
import { AuthAlert } from "@/components/auth/auth-alert";

const FEATURE_CHIPS: { Icon: LucideIcon; label: string }[] = [
  { Icon: CalendarClock, label: "Révision espacée" },
  { Icon: PawPrint, label: "Mots sauvages" },
  { Icon: Flame, label: "Séries" },
  { Icon: Languages, label: "Multi-langues" },
];

function LoginPageFallback() {
  return (
    <div className="auth-card" aria-busy="true" aria-label="Chargement">
      <p className="text-center text-sm text-muted">Chargement…</p>
    </div>
  );
}

function LoginPageContent() {
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
    <div className="auth-card">
      <div className="mb-5 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2 no-underline">
          <Logo size="auth" />
          <p className="m-0 text-xs text-muted">Apprends le vocabulaire autrement</p>
        </Link>
      </div>

      <h1 className="auth-step-title mb-6">Content de te revoir</h1>

      <form onSubmit={handleSubmit}>
        <label className="auth-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="ton@email.com"
          className="auth-field mb-4"
        />

        <label className="auth-label" htmlFor="login-password">
          Mot de passe
        </label>
        <div className="relative mb-1">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="auth-field"
            style={{ paddingRight: 48 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="auth-icon-btn absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={showPassword ? "Masquer" : "Afficher"}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        </div>

        <div className="mb-4 flex justify-end">
          <Link href="/forgot-password" className="auth-link text-sm">
            Mot de passe oublié ?
          </Link>
        </div>

        {error && (
          <AuthAlert icon={isRateLimited ? Timer : undefined} className="mb-4">
            {error}
          </AuthAlert>
        )}

        <button type="submit" disabled={loading} className="auth-submit">
          <LogIn size={18} strokeWidth={1.8} aria-hidden />
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-5 mb-4 flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-muted">
        Pas encore de compte ?
        <Link href={signupHref} className="auth-link text-sm">
          S&apos;inscrire
        </Link>
      </p>

      <div className="border-t border-line pt-4">
        <div className="flex flex-wrap justify-center gap-2">
          {FEATURE_CHIPS.map(({ Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-ink bg-surface px-2.5 py-1.5 text-xs font-medium text-ink"
            >
              <Icon size={15} strokeWidth={1.8} aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
