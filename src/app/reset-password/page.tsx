"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setErrorMsg("Une erreur est survenue, réessaie.");
      setStatus("error");
    }
  }

  if (!token) {
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
          textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <p style={{ color: "#555" }}>Lien invalide ou manquant.</p>
          <Link href="/forgot-password" style={{ color: "#6C3FC8", fontWeight: 600, textDecoration: "none" }}>
            Faire une nouvelle demande
          </Link>
        </div>
      </div>
    );
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
          <h1 style={{ color: "#6C3FC8", fontSize: "28px", margin: "0 0 8px" }}>Lexiva</h1>
          <h2 style={{ color: "#1a1a1a", fontSize: "20px", fontWeight: 600, margin: 0 }}>
            Nouveau mot de passe
          </h2>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              Ton mot de passe a été réinitialisé avec succès ! Tu vas être redirigé vers la connexion...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", color: "#1a1a1a" }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8 caractères minimum"
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

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", color: "#1a1a1a" }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Répète ton mot de passe"
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

            {(status === "error" || errorMsg) && (
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
              {status === "loading" ? "Enregistrement..." : "Enregistrer le mot de passe"}
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
