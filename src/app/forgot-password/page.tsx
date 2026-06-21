"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
      background: "#f5f3ff",
      fontFamily: "'DM Sans', Arial, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 4px 24px rgba(108, 63, 200, 0.1)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Image
            src="/logo-mark.png"
            alt="Lexiva"
            width={52}
            height={52}
            style={{ objectFit: "contain", display: "block", margin: "0 auto 12px" }}
          />
          <h1 style={{ color: "#6C3FC8", fontSize: "28px", margin: "0 0 8px" }}>Lexiva</h1>
          <h2 style={{ color: "#1a1a1a", fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Mot de passe oublié
          </h2>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              Si cet email est associé à un compte Lexiva, tu recevras un lien de réinitialisation dans quelques minutes.
            </p>
            <Link href="/login" style={{
              display: "inline-block",
              marginTop: "24px",
              color: "#6C3FC8",
              fontWeight: 600,
              textDecoration: "none",
            }}>
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "#555", marginBottom: "24px", lineHeight: 1.6 }}>
              Entre ton adresse email et on t'enverra un lien pour réinitialiser ton mot de passe.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", color: "#1a1a1a" }}>
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
                  border: "1.5px solid #ddd",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {status === "error" && (
              <p style={{ color: "#e53e3e", fontSize: "14px", marginBottom: "16px" }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "14px",
                background: status === "loading" ? "#a78bda" : "#6C3FC8",
                color: "#ffffff",
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
              <Link href="/login" style={{ color: "#6C3FC8", fontWeight: 600, textDecoration: "none", fontSize: "14px" }}>
                ← Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
