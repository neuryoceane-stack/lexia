"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Users } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";

const V = "var(--ink)";
const GREEN = "var(--ink)";
const GREEN_LIGHT = "var(--surface)";
const FOND = "var(--page)";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
          background: "var(--surface)",
          borderRadius: 16,
          overflow: "hidden",
          border: "1.5px solid var(--line)",
          boxShadow: "0 8px 40px color-mix(in srgb, var(--ink) 10%, transparent)",
        }}
      >
        <div style={{ background: V, padding: "28px 24px", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "color-mix(in srgb, var(--surface) 18%, transparent)",
              borderRadius: 20,
              padding: "5px 12px",
              marginBottom: 14,
            }}
          >
            <Users size={16} color="var(--surface)" strokeWidth={1.8} aria-hidden />
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--surface)", letterSpacing: "0.02em" }}>
              Espace professeur
            </span>
          </div>
          <p className="font-heading" style={{ fontSize: 26, color: "var(--surface)", marginBottom: 8 }}>
            Bientôt disponible
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: "color-mix(in srgb, var(--surface) 85%, transparent)", lineHeight: 1.5 }}>
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

              <Link href="/" className="auth-submit mt-4">
                Retour à l&apos;accueil
              </Link>

              <Link href="/signup" className="auth-link mt-1 text-sm">
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
                className="auth-field"
                autoComplete="email"
              />
              {emailError && <AuthAlert className="mt-2">{emailError}</AuthAlert>}

              {globalError && <AuthAlert className="mt-3">{globalError}</AuthAlert>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="auth-submit mt-4"
              >
                {loading ? "Envoi…" : "Prévenez-moi"}
              </button>

              <div className="mt-2 flex justify-center">
                <Link href="/signup" className="auth-link text-sm">
                  ← Je suis élève, retour à l&apos;inscription
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="auth-label">{children}</p>;
}
