"use client";

import { useState } from "react";
import type { CSSProperties, FocusEvent } from "react";
import Link from "next/link";
import { CheckCircle, Users } from "lucide-react";

const V = "var(--ink)";
const GREEN = "#1D9E75";
const GREEN_LIGHT = "#E1F5EE";
const FOND = "var(--page)";
const TEXT = "var(--ink)";
const MUTED = "var(--muted)";
const V_BORDER = "color-mix(in srgb, var(--ink) 18%, transparent)";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputStyle: CSSProperties = {
  fontSize: 14,
  padding: "11px 14px",
  borderRadius: 12,
  border: `1.5px solid ${V_BORDER}`,
  background: FOND,
  color: TEXT,
  outline: "none",
  width: "100%",
  fontFamily: "var(--font-sans), sans-serif",
};

function handleFocus(e: FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = V;
  e.currentTarget.style.background = "white";
}
function handleBlur(e: FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = V_BORDER;
  e.currentTarget.style.background = FOND;
}

export default function TeacherWaitlistPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  async function handleSubmit() {
    setEmailError("");
    setGlobalError("");

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setEmailError("Veuillez saisir votre adresse email.");
      return;
    }
    if (!EMAIL_REGEX.test(normalized)) {
      setEmailError("Veuillez saisir une adresse email valide.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/teacher-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyRegistered?: boolean;
      };

      if (!res.ok) {
        setGlobalError(data.error ?? "Une erreur est survenue. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      if (data.alreadyRegistered) {
        setAlreadyRegistered(true);
      } else {
        setSuccess(true);
      }
    } catch {
      setGlobalError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: FOND,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${V_BORDER}`,
          boxShadow: "0 8px 40px color-mix(in srgb, var(--ink) 10%, transparent)",
        }}
      >
        <div style={{ background: V, padding: "28px 24px", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 20,
              padding: "5px 12px",
              marginBottom: 14,
            }}
          >
            <Users size={15} color="white" />
            <span style={{ fontSize: 11, fontWeight: 500, color: "white", letterSpacing: "0.02em" }}>
              Espace professeur
            </span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 500, color: "white", marginBottom: 8 }}>
            Bientôt disponible
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
            L&apos;espace dédié aux professeurs arrive très prochainement. Laissez votre email,
            on vous prévient dès son ouverture.
          </p>
        </div>

        <div style={{ padding: "28px 24px" }}>
          {success || alreadyRegistered ? (
            <div
              style={{
                background: alreadyRegistered ? "color-mix(in srgb, var(--ink) 6%, transparent)" : GREEN_LIGHT,
                borderRadius: 16,
                padding: "28px 20px",
                textAlign: "center",
              }}
            >
              <CheckCircle
                size={40}
                color={alreadyRegistered ? V : GREEN}
                style={{ margin: "0 auto 14px" }}
              />
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: alreadyRegistered ? V : GREEN,
                  lineHeight: 1.5,
                }}
              >
                {alreadyRegistered
                  ? "Vous êtes déjà sur la liste."
                  : "C'est noté ! On vous prévient dès l'ouverture."}
              </p>

              <Link
                href="/"
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  borderRadius: 20,
                  background: V,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: "center",
                  textDecoration: "none",
                  marginTop: 16,
                  fontFamily: "var(--font-sans), sans-serif",
                }}
              >
                Retour à l&apos;accueil
              </Link>

              <Link
                href="/signup"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 12,
                  fontSize: 12,
                  fontWeight: 500,
                  color: V,
                  textDecoration: "none",
                }}
              >
                Aller à l&apos;inscription
              </Link>
            </div>
          ) : (
            <>
              <FieldLabel>Votre email</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (globalError) setGlobalError("");
                }}
                placeholder="vous@etablissement.fr"
                style={{ ...inputStyle, marginBottom: emailError ? 4 : 4 }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="email"
              />
              {emailError && (
                <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 14 }}>{emailError}</p>
              )}

              {globalError && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 12 }}>{globalError}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 20,
                  border: "none",
                  background: V,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading ? "default" : "pointer",
                  marginTop: 16,
                  fontFamily: "var(--font-sans), sans-serif",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Envoi…" : "Prévenez-moi"}
              </button>

              <Link
                href="/signup"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: 12,
                  color: MUTED,
                  textDecoration: "none",
                }}
              >
                ← Je suis élève, retour à l&apos;inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: MUTED,
        marginBottom: 6,
      }}
    >
      {children}
    </p>
  );
}
