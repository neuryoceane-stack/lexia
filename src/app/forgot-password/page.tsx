"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/logo";

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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--page)",
      fontFamily: "var(--font-sans), sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "var(--surface)",
        borderRadius: "16px",
        padding: "40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 4px 24px color-mix(in srgb, var(--ink) 10%, transparent)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Logo size="auth" className="mb-3" />
          <h2 style={{ color: "var(--ink)", fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Mot de passe oublié
          </h2>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Si cet e-mail est associé à un compte {BRAND_NAME}, tu recevras un lien de réinitialisation dans quelques minutes.
            </p>
            <Link href="/login" style={{
              display: "inline-block",
              marginTop: "24px",
              color: "var(--ink)",
              fontWeight: 600,
              textDecoration: "none",
            }}>
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "var(--muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              Entre ton adresse email et on t'enverra un lien pour réinitialiser ton mot de passe.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", color: "var(--ink)" }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ton@email.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--line)",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {status === "error" && (
              <p style={{ color: "var(--false-text)", fontSize: "14px", marginBottom: "16px" }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "14px",
                background: status === "loading" ? "var(--ink-soft)" : "var(--ink)",
                color: "var(--surface)",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: status === "loading" ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {status === "loading" ? "Envoi en cours..." : "Envoyer le lien"}
            </button>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Link href="/login" style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "none", fontSize: "14px" }}>
                ← Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
