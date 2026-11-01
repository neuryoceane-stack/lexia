"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CalendarDays, Check, ChevronLeft, FileText, GraduationCap, KeyRound, MessageCircle, PartyPopper, Rocket, Search, Share2, Smile, Sparkles, Users, type LucideIcon } from "lucide-react";
import { validateEmail, validatePassword } from "@/lib/validation";
import { ABONNEMENT_PATH } from "@/lib/abonnement-path";
import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/logo";
import { AuthAlert } from "@/components/auth/auth-alert";

type Role = "eleve" | "professeur";

type EleveStep =
  | "role"
  | "source"
  | "goal"
  | "identity"
  | "account"
  | "projection";

type ProfStep =
  | "role"
  | "identity"
  | "account"
  | "teacher"
  | "institution"
  | "promise";

const ACQUISITION_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "prof", label: "Recommandation d'un professeur", Icon: Users },
  { value: "social", label: "Réseaux sociaux", Icon: Share2 },
  { value: "google", label: "Recherche Google", Icon: Search },
  { value: "bouche_a_oreille", label: "Bouche à oreille", Icon: MessageCircle },
  { value: "autre", label: "Autre", Icon: Sparkles },
];

const GOAL_OPTIONS = [
  { value: 5, label: "5 mots", sub: "Pour commencer en douceur" },
  { value: 10, label: "10 mots", sub: "Régulier et efficace" },
  { value: 20, label: "20 mots", sub: "Ambitieux" },
  { value: 50, label: "50 mots", sub: "Mode champion" },
];

const V = "var(--ink)";
const V_LIGHT = "var(--background-subtle)";
const GOLD = "var(--ink)";
const GOLD_LIGHT = "var(--surface)";
const GREEN = "var(--ink)";
const GREEN_LIGHT = "var(--surface)";
const TEXT = "var(--ink)";
const MUTED = "var(--muted)";

function todayDateInputMax(): string {
  const t = new Date();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${m}-${d}`;
}

function validateBirthDate(value: string): { valid: boolean; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, error: "La date de naissance est requise." };
  }
  const parts = trimmed.split("-");
  if (parts.length !== 3) {
    return { valid: false, error: "Date invalide." };
  }
  const [year, month, day] = parts.map(Number);
  const date = new Date(trimmed + "T00:00:00");
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return { valid: false, error: "Date invalide." };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { valid: false, error: "La date ne peut pas être dans le futur." };
  }
  const ageYears = (today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 5) {
    return { valid: false, error: "Tu dois avoir au moins 5 ans pour t'inscrire." };
  }
  if (ageYears > 120) {
    return { valid: false, error: "Date de naissance invalide." };
  }
  return { valid: true };
}

function validateIdentityStep(
  firstName: string,
  lastName: string,
  birthDate: string
): { valid: boolean; error?: string } {
  if (!firstName.trim()) {
    return { valid: false, error: "Le prénom est requis." };
  }
  if (!lastName.trim()) {
    return { valid: false, error: "Le nom est requis." };
  }
  return validateBirthDate(birthDate);
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <p className="auth-label">
      {children}
      {required && <span style={{ color: "var(--false-text)" }}> *</span>}
    </p>
  );
}

function EmailTakenNotice({ email }: { email: string }) {
  const loginHref = `/login?email=${encodeURIComponent(email.trim().toLowerCase())}`;
  return (
    <AuthAlert className="mb-3.5">
      Cette adresse est déjà utilisée.{" "}
      <Link href={loginHref} className="auth-link">
        Connecte-toi
      </Link>
    </AuthAlert>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="auth-link mb-2 text-sm">
      <ChevronLeft size={18} strokeWidth={1.8} aria-hidden />
      Retour
    </button>
  );
}

function CTA({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  gold?: boolean;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled}
      className="auth-submit mt-4"
    >
      {children}
    </button>
  );
}

function SkipLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="auth-link mx-auto mt-1 text-sm">
      Passer cette étape
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 8, background: "var(--background-subtle)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: "var(--mark)", borderRadius: 999, transition: "width 350ms ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{current}/{total}</span>
    </div>
  );
}

function Card({ children, selected, onClick, accent }: { children: ReactNode; selected?: boolean; onClick?: () => void; accent?: string }) {
  const border = selected ? (accent ?? V) : "var(--line)";
  const bg = selected ? V_LIGHT : "var(--surface)";
  const interactive = Boolean(onClick);
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 14,
        padding: "14px 16px",
        minHeight: 52,
        cursor: interactive ? "pointer" : "default",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      {children}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [eleveStep, setEleveStep] = useState<EleveStep>("role");
  const [profStep, setProfStep] = useState<ProfStep>("role");

  const [acquisitionSource, setAcquisitionSource] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [teacherSubject, setTeacherSubject] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [accountChecking, setAccountChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccountContinue() {
    if (!email.trim()) {
      setError("L'adresse email est requise.");
      return;
    }
    const emailCheck = validateEmail(email.trim());
    if (!emailCheck.valid) {
      setError(emailCheck.error ?? "Format d'email invalide.");
      return;
    }
    if (!password) {
      setError("Le mot de passe est requis.");
      return;
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.error ?? "Mot de passe invalide.");
      return;
    }

    setError("");
    setEmailTaken(false);
    setAccountChecking(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Impossible de vérifier l'adresse email.");
        return;
      }
      if (!data.available) {
        setEmailTaken(true);
        return;
      }
      setEleveStep("projection");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setAccountChecking(false);
    }
  }

  async function handleRegister() {
    setError("");
    setEmailTaken(false);
    setLoading(true);
    try {
      const isProf = role === "professeur";
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          birthDate: birthDate || undefined,
          role: isProf ? "professeur" : "etudiant",
          subject: isProf ? teacherSubject.trim() || undefined : undefined,
          school_name: isProf ? schoolName.trim() || undefined : undefined,
          institution_code: isProf ? institutionCode.trim() || undefined : undefined,
          acquisition_source: !isProf ? acquisitionSource || undefined : undefined,
          weekly_goal: !isProf ? weeklyGoal ?? undefined : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && role === "eleve") {
          setEmailTaken(true);
          setError("");
        } else {
          setEmailTaken(false);
          setError(data.error ?? "Inscription impossible.");
        }
        setLoading(false);
        return;
      }
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!loginRes.ok) {
        setError(
          isProf
            ? "Compte créé. Connectez-vous avec votre email et mot de passe."
            : "Compte créé. Connecte-toi avec ton email et ton mot de passe."
        );
        setLoading(false);
        return;
      }
      router.push(
        !isProf && data.postSignupPath === ABONNEMENT_PATH
          ? ABONNEMENT_PATH
          : "/app"
      );
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function calcProjection() {
    return (weeklyGoal ?? 10) * 13;
  }

  const wrap = (content: ReactNode, progressCurrent?: number, progressTotal?: number) => (
    <div className="mx-auto w-full">
      <div className="auth-card">
        {progressCurrent !== undefined && progressTotal !== undefined && (
          <ProgressBar current={progressCurrent} total={progressTotal} />
        )}
        {content}
      </div>
      {(eleveStep !== "role" || profStep !== "role") && (
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-muted">
          Déjà un compte ?
          <Link href="/login" className="auth-link text-sm">Se connecter</Link>
        </p>
      )}
    </div>
  );

  if (eleveStep === "role" && profStep === "role") {
    return (
      <div
        style={{
          position: "relative",
          width: "min(520px, calc(100vw - 32px))",
          marginLeft: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: "-48px -32px",
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "-12%",
              top: "8%",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: V,
              opacity: 0.07,
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "-8%",
              top: "18%",
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: V,
              opacity: 0.06,
              filter: "blur(32px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "20%",
              bottom: "6%",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: GOLD,
              opacity: 0.08,
              filter: "blur(28px)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "var(--surface)",
            borderRadius: 24,
            padding: "32px 28px 24px",
            border: "1.5px solid var(--line)",
            boxShadow: "0 8px 32px color-mix(in srgb, var(--ink) 10%, transparent)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Logo size="auth" className="mb-[10px]" />
            <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "8px 0 4px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: V }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.02em", marginBottom: 24 }}>Apprends le vocabulaire autrement</p>
          </div>

          <h1 className="auth-step-title">Qui êtes-vous ?</h1>
          <p style={{ fontSize: 13, color: MUTED, textAlign: "center", marginBottom: 22 }}>Choisissez votre rôle pour commencer</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <button type="button"
              onClick={() => { setRole("eleve"); setEleveStep("source"); }}
              style={{
                background: "var(--page)",
                border: "1.5px solid var(--line)", borderRadius: 20,
                padding: "18px 10px 14px", cursor: "pointer", textAlign: "center",
                transition: "border-color 0.15s", fontFamily: "var(--font-sans), sans-serif",
                width: "100%", minWidth: 0, minHeight: 44,
              }}>
              <GraduationCap size={40} color={V} strokeWidth={1.8} style={{ display: "block", margin: "0 auto 10px" }} />
              <div style={{ display: "inline-block", background: V, color: "var(--surface)", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20, marginBottom: 10 }}>Élève</div>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>J&apos;apprends du vocabulaire</p>
            </button>

            <button type="button"
              onClick={() => router.push("/signup/professeur")}
              style={{
                background: "var(--page)",
                border: "1.5px solid var(--line)", borderRadius: 20,
                padding: "18px 10px 14px", cursor: "pointer", textAlign: "center",
                transition: "border-color 0.15s", fontFamily: "var(--font-sans), sans-serif",
                width: "100%", minWidth: 0, minHeight: 44,
              }}>
              <Users size={40} color={GREEN} strokeWidth={1.8} style={{ display: "block", margin: "0 auto 10px" }} />
              <div style={{ display: "inline-block", background: GREEN, color: "var(--surface)", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20, marginBottom: 10 }}>Professeur</div>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>Je crée des listes pour mes élèves</p>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: "color-mix(in srgb, var(--ink) 8%, transparent)" }} />
            <span style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Bienvenue dans la magie du vocabulaire</span>
            <div style={{ flex: 1, height: 1, background: "color-mix(in srgb, var(--ink) 8%, transparent)" }} />
          </div>

          <p className="flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-muted">
            Déjà un compte ?
            <Link href="/login" className="auth-link text-sm">Se connecter</Link>
          </p>
        </div>
      </div>
    );
  }

  if (role === "eleve") {
    if (eleveStep === "source") return wrap(
      <>
        <BackBtn onClick={() => { setRole(null); setEleveStep("role"); setProfStep("role"); }} />
        <h1 className="auth-step-title">Comment as-tu entendu parler de {BRAND_NAME} ?</h1>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20, textAlign: "center", textWrap: "balance" }}>Cela nous aide à améliorer l&apos;application.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACQUISITION_OPTIONS.map(opt => (
            <Card key={opt.value} selected={acquisitionSource === opt.value} onClick={() => setAcquisitionSource(opt.value)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <opt.Icon size={18} color={V} strokeWidth={1.8} aria-hidden />
                <span style={{ fontSize: 14, color: TEXT }}>{opt.label}</span>
                {acquisitionSource === opt.value && <Check size={18} strokeWidth={1.8} color={V} aria-hidden style={{ marginLeft: "auto" }} />}
              </div>
            </Card>
          ))}
        </div>
        <CTA onClick={() => setEleveStep("goal")}>Continuer →</CTA>
        <SkipLink onClick={() => setEleveStep("goal")} />
      </>,
      1, 5
    );

    if (eleveStep === "goal") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("source")} />
        <h1 className="auth-step-title">Quel est ton objectif de vocabulaire ?</h1>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20, textAlign: "center", textWrap: "balance" }}>Nombre de mots à apprendre par semaine.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GOAL_OPTIONS.map(opt => (
            <Card key={opt.value} selected={weeklyGoal === opt.value} onClick={() => setWeeklyGoal(opt.value)} accent={V}>
              <p className="font-heading" style={{ fontSize: 20, color: weeklyGoal === opt.value ? V : TEXT, marginBottom: 2 }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: MUTED }}>{opt.sub}</p>
            </Card>
          ))}
        </div>
        <CTA onClick={() => { if (weeklyGoal) setEleveStep("identity"); }} disabled={!weeklyGoal}>Continuer →</CTA>
        <SkipLink onClick={() => setEleveStep("identity")} />
      </>,
      2, 5
    );

    if (eleveStep === "identity") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("goal")} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <h1 className="auth-step-title" style={{ margin: 0 }}>Faisons connaissance</h1>
          <Smile size={22} color={TEXT} strokeWidth={1.8} aria-hidden />
        </div>
        <FieldLabel required>Prénom</FieldLabel>
        <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setIdentityError(""); }}
          placeholder="Ton prénom" className="auth-field mb-3.5" />
        <FieldLabel required>Nom</FieldLabel>
        <input type="text" value={lastName} onChange={e => { setLastName(e.target.value); setIdentityError(""); }}
          placeholder="Ton nom" className="auth-field mb-3.5" />
        <FieldLabel required>Date de naissance</FieldLabel>
        <input type="date" value={birthDate} max={todayDateInputMax()} required
          onChange={e => { setBirthDate(e.target.value); setIdentityError(""); }}
          className="auth-field mb-1" />
        <p style={{ fontSize: 11, color: MUTED, marginBottom: identityError ? 8 : 4 }}>
          <span style={{ color: "var(--false-text)" }}>*</span> Champs obligatoires
        </p>
        {identityError && <AuthAlert className="mb-2">{identityError}</AuthAlert>}
        <CTA
          onClick={() => {
            const check = validateIdentityStep(firstName, lastName, birthDate);
            if (!check.valid) {
              setIdentityError(check.error ?? "Merci de remplir tous les champs obligatoires.");
              return;
            }
            setIdentityError("");
            setEleveStep("account");
          }}
          disabled={!firstName.trim() || !lastName.trim() || !birthDate.trim()}
        >
          Continuer →
        </CTA>
      </>,
      3, 5
    );

    if (eleveStep === "account") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("identity")} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <h1 className="auth-step-title" style={{ margin: 0 }}>Crée ton compte</h1>
          <KeyRound size={22} color={TEXT} strokeWidth={1.8} aria-hidden />
        </div>
        <FieldLabel required>Adresse email</FieldLabel>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); setEmailTaken(false); }}
          placeholder="ton@email.com" className={emailTaken ? "auth-field mb-1" : "auth-field mb-3.5"} autoComplete="email" />
        {emailTaken && <EmailTakenNotice email={email} />}
        <FieldLabel required>Mot de passe</FieldLabel>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input type={showPassword ? "text" : "password"} value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="••••••••"
            className="auth-field" style={{ paddingRight: 48 }} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="auth-icon-btn absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={showPassword ? "Masquer" : "Afficher"}>
            {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>8 caractères min. · 1 majuscule · 1 chiffre</p>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: error ? 8 : 4 }}>
          <span style={{ color: "var(--false-text)" }}>*</span> Champs obligatoires
        </p>
        {error && !emailTaken && <AuthAlert className="mb-2">{error}</AuthAlert>}
        <CTA
          onClick={handleAccountContinue}
          disabled={
            accountChecking ||
            !email.trim() ||
            !password ||
            !validateEmail(email.trim()).valid ||
            !validatePassword(password).valid
          }
        >
          {accountChecking ? "Vérification…" : "Continuer →"}
        </CTA>
      </>,
      4, 5
    );

    if (eleveStep === "projection") {
      const mots = calcProjection();
      return wrap(
        <>
          <BackBtn onClick={() => { setError(""); setEmailTaken(false); setEleveStep("account"); }} />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Rocket size={44} color={V} strokeWidth={1.8} aria-hidden />
            </div>
            <h1 className="auth-step-title">Voici ce que tu peux accomplir en 3 mois</h1>
            <p style={{ fontSize: 13, color: MUTED, textWrap: "balance" }}>Basé sur ton objectif de {weeklyGoal ?? 10} mots/semaine</p>
          </div>
          <div style={{ background: V_LIGHT, borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 48, fontWeight: 500, color: V, marginBottom: 4 }}>{mots}</p>
            <p style={{ fontSize: 14, color: V }}>mots mémorisés</p>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ background: GREEN_LIGHT, borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <p className="font-heading" style={{ fontSize: 20, color: GREEN }}>SM-2</p>
              <p style={{ fontSize: 11, color: MUTED }}>algorithme d&apos;apprentissage</p>
            </div>
          </div>
          <CTA onClick={handleRegister} disabled={loading}>
            {loading ? "Création du compte…" : "Créer mon compte →"}
          </CTA>
          {emailTaken ? (
            <EmailTakenNotice email={email} />
          ) : error ? (
            <AuthAlert className="mt-2">{error}</AuthAlert>
          ) : null}
        </>,
        5, 5
      );
    }
  }

  if (role === "professeur") {
    if (profStep === "identity") return wrap(
      <>
        <BackBtn onClick={() => { setRole(null); setEleveStep("role"); setProfStep("role"); }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <h1 className="auth-step-title" style={{ margin: 0 }}>Faisons connaissance</h1>
          <Smile size={22} color={TEXT} strokeWidth={1.8} aria-hidden />
        </div>
        <FieldLabel>Prénom</FieldLabel>
        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
          placeholder="Votre prénom" className="auth-field mb-3.5" />
        <FieldLabel>Nom</FieldLabel>
        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
          placeholder="Votre nom" className="auth-field mb-3.5" />
        <FieldLabel>Date de naissance</FieldLabel>
        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
          className="auth-field mb-1" />
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Optionnel — utilisé pour personnaliser votre expérience.</p>
        <CTA onClick={() => setProfStep("account")}>Continuer →</CTA>
      </>,
      1, 5
    );

    if (profStep === "account") return wrap(
      <>
        <BackBtn onClick={() => setProfStep("identity")} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <h1 className="auth-step-title" style={{ margin: 0 }}>Créez votre compte</h1>
          <Sparkles size={22} color={TEXT} strokeWidth={1.8} aria-hidden />
        </div>
        <FieldLabel>Adresse email</FieldLabel>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="vous@email.com" className="auth-field mb-3.5" autoComplete="email" />
        <FieldLabel>Mot de passe</FieldLabel>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input type={showPassword ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            className="auth-field" style={{ paddingRight: 48 }} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="auth-icon-btn absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={showPassword ? "Masquer" : "Afficher"}>
            {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>8 caractères min. · 1 majuscule · 1 chiffre</p>
        {error && <AuthAlert className="mb-2">{error}</AuthAlert>}
        <CTA onClick={() => {
          setError("");
          if (!email.trim() || !password) { setError("Email et mot de passe requis."); return; }
          if (password.length < 8) { setError("Mot de passe trop court (8 car. min.)"); return; }
          setProfStep("teacher");
        }}>Continuer →</CTA>
      </>,
      2, 5
    );

    if (profStep === "teacher") return wrap(
      <>
        <BackBtn onClick={() => setProfStep("account")} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <h1 className="auth-step-title" style={{ margin: 0 }}>Votre profil professeur</h1>
          <GraduationCap size={22} color={TEXT} strokeWidth={1.8} aria-hidden />
        </div>
        <FieldLabel>Matière enseignée (optionnel)</FieldLabel>
        <input type="text" value={teacherSubject} onChange={e => setTeacherSubject(e.target.value)}
          placeholder="Ex. : Anglais, Espagnol, Latin…" className="auth-field mb-3.5" />
        <FieldLabel>Établissement (optionnel)</FieldLabel>
        <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)}
          placeholder="Ex. : Lycée Victor Hugo, Paris" className="auth-field mb-1" />
        <CTA onClick={() => setProfStep("institution")}>Continuer →</CTA>
        <SkipLink onClick={() => setProfStep("institution")} />
      </>,
      3, 5
    );

    if (profStep === "institution") return wrap(
      <>
        <BackBtn onClick={() => setProfStep("teacher")} />
        <h1 className="auth-step-title">Code institution</h1>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Si votre établissement a souscrit à {BRAND_NAME}, saisissez le code fourni par votre administration.</p>
        <FieldLabel>Code institution (optionnel)</FieldLabel>
        <input type="text" value={institutionCode} onChange={e => setInstitutionCode(e.target.value.toUpperCase())}
          placeholder="Ex. : LVH-2025" className="auth-field mb-1" style={{ letterSpacing: "0.1em" }} maxLength={20} />
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Le code débloque l&apos;accès premium pour votre établissement.</p>
        <CTA onClick={() => setProfStep("promise")}>Continuer →</CTA>
        <SkipLink onClick={() => setProfStep("promise")} />
      </>,
      4, 5
    );

    if (profStep === "promise") return wrap(
      <>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <GraduationCap size={44} color={TEXT} strokeWidth={1.8} aria-hidden style={{ display: "block", margin: "0 auto 10px" }} />
          <h1 className="auth-step-title">Tout ce que vous pourrez faire avec {BRAND_NAME}</h1>
          <p style={{ fontSize: 13, color: MUTED }}>En un trimestre avec vos élèves</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            { Icon: FileText, title: "Créer vos listes de vocabulaire", sub: "En quelques clics, depuis un PDF ou une URL", bg: V_LIGHT },
            { Icon: Users, title: "Suivre la progression de vos élèves", sub: "Statistiques par élève et par liste", bg: GREEN_LIGHT },
            { Icon: CalendarDays, title: "Assigner des révisions ciblées", sub: "Programmez des sessions adaptées", bg: GOLD_LIGHT },
          ].map(item => (
            <div key={item.title} style={{ background: item.bg, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <item.Icon size={20} strokeWidth={1.8} color={V} aria-hidden />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: V, marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: MUTED }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
        {error && <AuthAlert className="mb-2">{error}</AuthAlert>}
        <CTA onClick={handleRegister} disabled={loading} gold>
          {loading ? "Création du compte…" : (
            <>
              C&apos;est parti !
              <PartyPopper size={18} strokeWidth={1.8} aria-hidden />
            </>
          )}
        </CTA>
        <p style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 10 }}>Compte gratuit · Sans engagement</p>
      </>,
      5, 5
    );
  }

  return null;
}
