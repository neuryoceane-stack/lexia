"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/logo";
import { FloatingWords } from "@/components/auth/floating-words";
import { AuthAlert } from "@/components/auth/auth-alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Une erreur est survenue, réessaie.");
      setStatus("error");
    }
  }

  return (
    <FloatingWords>
      <div className="auth-card">
        <div className="mb-6 text-center">
          <Logo size="auth" className="mb-3" />
          <h1 className="auth-step-title">Mot de passe oublié</h1>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <div className="auth-status auth-status-just" role="status">
              <Mail size={28} strokeWidth={1.8} aria-hidden />
              <p>
                Si cet e-mail est associé à un compte {BRAND_NAME}, tu recevras un lien de réinitialisation dans quelques minutes.
              </p>
            </div>
            <Link href="/login" className="auth-link mt-4 text-sm">
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              Entre ton adresse email et on t&apos;enverra un lien pour réinitialiser ton mot de passe.
            </p>

            <div className="mb-5">
              <label className="auth-label" htmlFor="forgot-email">
                Adresse email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ton@email.com"
                className="auth-field"
              />
            </div>

            {status === "error" && <AuthAlert className="mb-4">{errorMsg}</AuthAlert>}

            <button type="submit" disabled={status === "loading"} className="auth-submit">
              {status === "loading" ? "Envoi en cours..." : "Envoyer le lien"}
            </button>

            <div className="mt-4 flex justify-center">
              <Link href="/login" className="auth-link text-sm">
                ← Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </FloatingWords>
  );
}
