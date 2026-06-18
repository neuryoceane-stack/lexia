"use client";

import { useState } from "react";
import type { CSSProperties, FocusEvent } from "react";
import Link from "next/link";
import { GraduationCap, CheckCircle } from "lucide-react";

const V = "#6C3FC8";
const GREEN = "#1D9E75";
const GREEN_LIGHT = "#E1F5EE";
const FOND = "#F8F7FF";
const TEXT = "#1A1033";
const MUTED = "#7C6FA3";
const V_BORDER = "rgba(108,63,200,0.18)";

const inputStyle: CSSProperties = {
  fontSize: 14,
  padding: "11px 14px",
  borderRadius: 12,
  border: `1.5px solid ${V_BORDER}`,
  background: FOND,
  color: TEXT,
  outline: "none",
  width: "100%",
  fontFamily: "DM Sans, sans-serif",
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [globalError, setGlobalError] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit() {
    setNameError("");
    setEmailError("");
    setGlobalError("");

    let hasError = false;
    if (!name.trim()) {
      setNameError("Veuillez indiquer votre nom.");
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError("Veuillez saisir votre adresse email.");
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const res = await fetch("/api/teacher-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          institution: institution.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGlobalError(data.error ?? "Une erreur est survenue. Veuillez réessayer.");
        setLoading(false);
        return;
      }
      setSuccessMessage(
        typeof data.message === "string" && data.message
          ? data.message
          : "Merci ! Vous serez prévenu(e) dès l'ouverture de l'espace professeur."
      );
      setSuccess(true);
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
        fontFamily: "DM Sans, sans-serif",
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
          boxShadow: "0 8px 40px rgba(108,63,200,0.1)",
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
            <GraduationCap size={15} color="white" />
            <span style={{ fontSize: 11, fontWeight: 500, color: "white", letterSpacing: "0.02em" }}>
              Espace professeur
            </span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 500, color: "white", marginBottom: 8 }}>
            Bientôt disponible
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
            L&apos;espace dédié aux enseignants arrive très prochainement. Laissez-nous votre email
            pour être prévenu(e) dès son ouverture.
          </p>
        </div>

        <div style={{ padding: "28px 24px" }}>
          {success ? (
            <div
              style={{
                background: GREEN_LIGHT,
                borderRadius: 16,
                padding: "28px 20px",
                textAlign: "center",
              }}
            >
              <CheckCircle size={40} color={GREEN} style={{ margin: "0 auto 14px" }} />
              <p style={{ fontSize: 15, fontWeight: 500, color: GREEN, lineHeight: 1.5 }}>
                {successMessage}
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
                  fontFamily: "DM Sans, sans-serif",
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
              <FieldLabel>Votre nom</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Camille Dupont"
                style={{ ...inputStyle, marginBottom: nameError ? 4 : 14 }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              {nameError && (
                <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 14 }}>{nameError}</p>
              )}

              <FieldLabel>Votre email</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@etablissement.fr"
                style={{ ...inputStyle, marginBottom: emailError ? 4 : 14 }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="email"
              />
              {emailError && (
                <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 14 }}>{emailError}</p>
              )}

              <FieldLabel>Établissement (optionnel)</FieldLabel>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex. Lycée Victor Hugo"
                style={{ ...inputStyle, marginBottom: 4 }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

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
                  fontFamily: "DM Sans, sans-serif",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Envoi…" : "Rejoindre la liste d'attente"}
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
