"use client";

import { useState } from "react";
import type { CSSProperties, FocusEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronLeft, GraduationCap, KeyRound, MessageCircle, Rocket, Search, Share2, Smile, Sparkles, Users, type LucideIcon } from "lucide-react";
import { validateEmail, validatePassword } from "@/lib/validation";
import { ABONNEMENT_PATH } from "@/lib/abonnement-path";
import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/logo";

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
const V_BORDER = "color-mix(in srgb, var(--ink) 18%, transparent)";
const GOLD = "var(--ink)";
const GOLD_LIGHT = "var(--surface)";
const GREEN = "var(--ink)";
const GREEN_LIGHT = "var(--surface)";
const FOND = "var(--page)";
const TEXT = "var(--ink)";
const MUTED = "var(--muted)";

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
    <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED, marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: "var(--false-text)" }}> *</span>}
    </p>
  );
}

function EmailTakenNotice({ email }: { email: string }) {
  const loginHref = `/login?email=${encodeURIComponent(email.trim().toLowerCase())}`;
  return (
    <p style={{ fontSize: 12, color: "var(--false-text)", marginBottom: 14, lineHeight: 1.45 }}>
      Cette adresse est déjà utilisée.{" "}
      <Link href={loginHref} style={{ color: V, fontWeight: 500, textDecoration: "underline" }}>
        Connecte-toi
      </Link>
    </p>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: MUTED, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>
      <ChevronLeft size={14} stroke={MUTED} />Retour
    </button>
  );
}

function CTA({ children, onClick, disabled, gold }: { children: ReactNode; onClick?: () => void; disabled?: boolean; gold?: boolean }) {
  return (
    <button type={onClick ? "button" : "submit"} onClick={onClick} disabled={disabled}
      style={{
        width: "100%", padding: "13px", borderRadius: 20, border: "none",
        background: gold ? GOLD : V, color: "var(--surface)", fontSize: 14, fontWeight: 500,
        cursor: "pointer", marginTop: 16, fontFamily: "var(--font-sans), sans-serif",
        opacity: disabled ? 0.5 : 1,
      }}>
      {children}
    </button>
  );
}

function SkipLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: "block", width: "100%", textAlign: "center", marginTop: 10, fontSize: 12, color: MUTED, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
      Passer cette étape
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 4, background: V_LIGHT, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: V, borderRadius: 4, transition: "width 350ms ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: V }}>{current}/{total}</span>
    </div>
  );
}

function Card({ children, selected, onClick, accent }: { children: ReactNode; selected?: boolean; onClick?: () => void; accent?: string }) {
  const border = selected ? (accent ?? V) : V_BORDER;
  const bg = selected ? (accent === GOLD ? GOLD_LIGHT : accent === GREEN ? GREEN_LIGHT : V_LIGHT) : "white";
  return (
    <div onClick={onClick}
      style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: "14px 16px", cursor: onClick ? "pointer" : "default", transition: "all 0.15s" }}>
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
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
      <div style={{ background: "var(--surface)", borderRadius: 20, padding: "28px 24px", border: `1px solid ${V_BORDER}`, boxShadow: "0 2px 24px color-mix(in srgb, var(--ink) 7%, transparent)" }}>
        {progressCurrent !== undefined && progressTotal !== undefined && (
          <ProgressBar current={progressCurrent} total={progressTotal} />
        )}
        {content}
      </div>
      {(eleveStep !== "role" || profStep !== "role") && (
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: MUTED }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: V, fontWeight: 500, textDecoration: "none" }}>Se connecter</Link>
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
            border: `1px solid ${V_BORDER}`,
            boxShadow: "0 8px 32px color-mix(in srgb, var(--ink) 10%, transparent)",
          }}
        >
          <div style={{ position: "absolute", top: 16, left: 22, fontSize: 12, color: GOLD, opacity: 0.45 }}>✦</div>
          <div style={{ position: "absolute", top: 14, right: 26, fontSize: 10, color: V, opacity: 0.35 }}>✦</div>
          <div style={{ position: "absolute", bottom: 88, left: 18, fontSize: 9, color: V, opacity: 0.28 }}>✦</div>
          <div style={{ position: "absolute", bottom: 96, right: 20, fontSize: 11, color: GOLD, opacity: 0.32 }}>✦</div>

          <div style={{ textAlign: "center" }}>
            <Logo size="auth" className="mb-[10px]" />
            <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "8px 0 4px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: V }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.02em", marginBottom: 24 }}>Apprends le vocabulaire autrement</p>
          </div>

          <p style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", textAlign: "center", marginBottom: 6 }}>Qui êtes-vous ?</p>
          <p style={{ fontSize: 13, color: MUTED, textAlign: "center", marginBottom: 22 }}>Choisissez votre rôle pour commencer</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <button type="button"
              onClick={() => { setRole("eleve"); setEleveStep("source"); }}
              style={{
                background: "linear-gradient(160deg,var(--page) 0%,var(--background-subtle) 100%)",
                border: `2px solid ${V_BORDER}`, borderRadius: 20,
                padding: "18px 10px 14px", cursor: "pointer", textAlign: "center",
                transition: "all 0.25s", fontFamily: "var(--font-sans), sans-serif",
                width: "100%", minWidth: 0,
              }}>
              <GraduationCap size={40} color={V} strokeWidth={1.75} style={{ display: "block", margin: "0 auto 10px" }} />
              <div style={{ display: "inline-block", background: V, color: "var(--surface)", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20, marginBottom: 10 }}>Élève</div>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>J&apos;apprends du vocabulaire</p>
            </button>

            <button type="button"
              onClick={() => router.push("/signup/professeur")}
              style={{
                background: "var(--page)",
                border: "1.5px solid var(--line)", borderRadius: 20,
                padding: "18px 10px 14px", cursor: "pointer", textAlign: "center",
                transition: "all 0.25s", fontFamily: "var(--font-sans), sans-serif",
                width: "100%", minWidth: 0,
              }}>
              <Users size={40} color={GREEN} strokeWidth={1.75} style={{ display: "block", margin: "0 auto 10px" }} />
              <div style={{ display: "inline-block", background: GREEN, color: "var(--surface)", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20, marginBottom: 10 }}>Professeur</div>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>Je crée des listes pour mes élèves</p>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: "color-mix(in srgb, var(--ink) 8%, transparent)" }} />
            <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>Bienvenue dans la magie du vocabulaire</span>
            <div style={{ flex: 1, height: 1, background: "color-mix(in srgb, var(--ink) 8%, transparent)" }} />
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: MUTED }}>
            Déjà un compte ?{" "}
            <Link href="/login" style={{ color: V, fontWeight: 500, textDecoration: "none" }}>Se connecter</Link>
          </p>
        </div>
      </div>
    );
  }

  if (role === "eleve") {
    if (eleveStep === "source") return wrap(
      <>
        <BackBtn onClick={() => { setRole(null); setEleveStep("role"); setProfStep("role"); }} />
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 4, textAlign: "center", textWrap: "balance" }}>Comment as-tu entendu parler de {BRAND_NAME} ?</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20, textAlign: "center", textWrap: "balance" }}>Cela nous aide à améliorer l&apos;application.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACQUISITION_OPTIONS.map(opt => (
            <Card key={opt.value} selected={acquisitionSource === opt.value} onClick={() => setAcquisitionSource(opt.value)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <opt.Icon size={18} color={V} strokeWidth={1.75} aria-hidden />
                <span style={{ fontSize: 14, color: TEXT }}>{opt.label}</span>
                {acquisitionSource === opt.value && <span style={{ marginLeft: "auto", color: V, fontSize: 16 }}>✓</span>}
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
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 4, textAlign: "center", textWrap: "balance" }}>Quel est ton objectif de vocabulaire ?</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20, textAlign: "center", textWrap: "balance" }}>Nombre de mots à apprendre par semaine.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GOAL_OPTIONS.map(opt => (
            <Card key={opt.value} selected={weeklyGoal === opt.value} onClick={() => setWeeklyGoal(opt.value)} accent={V}>
              <p style={{ fontSize: 20, fontWeight: 500, color: weeklyGoal === opt.value ? V : TEXT, marginBottom: 2 }}>{opt.label}</p>
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
          <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, textAlign: "center", textWrap: "balance", margin: 0 }}>Faisons connaissance</p>
          <Smile size={20} color={TEXT} strokeWidth={1.75} aria-hidden />
        </div>
        <FieldLabel required>Prénom</FieldLabel>
        <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setIdentityError(""); }}
          placeholder="Ton prénom" style={{ ...inputStyle, marginBottom: 14 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <FieldLabel required>Nom</FieldLabel>
        <input type="text" value={lastName} onChange={e => { setLastName(e.target.value); setIdentityError(""); }}
          placeholder="Ton nom" style={{ ...inputStyle, marginBottom: 14 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <FieldLabel required>Date de naissance</FieldLabel>
        <input type="date" value={birthDate} max={todayDateInputMax()} required
          onChange={e => { setBirthDate(e.target.value); setIdentityError(""); }}
          style={{ ...inputStyle, marginBottom: 4 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <p style={{ fontSize: 11, color: MUTED, marginBottom: identityError ? 8 : 4 }}>
          <span style={{ color: "var(--false-text)" }}>*</span> Champs obligatoires
        </p>
        {identityError && <p style={{ fontSize: 12, color: "var(--false-text)", marginBottom: 8 }}>{identityError}</p>}
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
          <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, textAlign: "center", textWrap: "balance", margin: 0 }}>Crée ton compte</p>
          <KeyRound size={20} color={TEXT} strokeWidth={1.75} aria-hidden />
        </div>
        <FieldLabel required>Adresse email</FieldLabel>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); setEmailTaken(false); }}
          placeholder="ton@email.com" style={{ ...inputStyle, marginBottom: emailTaken ? 4 : 14 }}
          onFocus={handleFocus} onBlur={handleBlur} autoComplete="email" />
        {emailTaken && <EmailTakenNotice email={email} />}
        <FieldLabel required>Mot de passe</FieldLabel>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input type={showPassword ? "text" : "password"} value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="••••••••"
            style={{ ...inputStyle, paddingRight: 40 }}
            onFocus={handleFocus} onBlur={handleBlur} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MUTED }}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>8 caractères min. · 1 majuscule · 1 chiffre</p>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: error ? 8 : 4 }}>
          <span style={{ color: "var(--false-text)" }}>*</span> Champs obligatoires
        </p>
        {error && !emailTaken && <p style={{ fontSize: 12, color: "var(--false-text)", marginBottom: 8 }}>{error}</p>}
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
              <Rocket size={44} color={V} strokeWidth={1.75} aria-hidden />
            </div>
            <p style={{ fontSize: 17, fontWeight: 500, color: TEXT, marginBottom: 6, textWrap: "balance" }}>Voici ce que tu peux accomplir en 3 mois</p>
            <p style={{ fontSize: 13, color: MUTED, textWrap: "balance" }}>Basé sur ton objectif de {weeklyGoal ?? 10} mots/semaine</p>
          </div>
          <div style={{ background: V_LIGHT, borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 48, fontWeight: 500, color: V, marginBottom: 4 }}>{mots}</p>
            <p style={{ fontSize: 14, color: V }}>mots mémorisés</p>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ background: GREEN_LIGHT, borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 500, color: GREEN }}>SM-2</p>
              <p style={{ fontSize: 11, color: MUTED }}>algorithme d&apos;apprentissage</p>
            </div>
          </div>
          <CTA onClick={handleRegister} disabled={loading}>
            {loading ? "Création du compte…" : "Créer mon compte →"}
          </CTA>
          {emailTaken ? (
            <EmailTakenNotice email={email} />
          ) : error ? (
            <p style={{ fontSize: 12, color: "var(--false-text)", marginTop: 8 }}>{error}</p>
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
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 20 }}>Faisons connaissance 👋</p>
        <FieldLabel>Prénom</FieldLabel>
        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
          placeholder="Votre prénom" style={{ ...inputStyle, marginBottom: 14 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <FieldLabel>Nom</FieldLabel>
        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
          placeholder="Votre nom" style={{ ...inputStyle, marginBottom: 14 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <FieldLabel>Date de naissance</FieldLabel>
        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
          style={{ ...inputStyle, marginBottom: 4 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Optionnel — utilisé pour personnaliser votre expérience.</p>
        <CTA onClick={() => setProfStep("account")}>Continuer →</CTA>
      </>,
      1, 5
    );

    if (profStep === "account") return wrap(
      <>
        <BackBtn onClick={() => setProfStep("identity")} />
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 20 }}>Créez votre compte ✨</p>
        <FieldLabel>Adresse email</FieldLabel>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="vous@email.com" style={{ ...inputStyle, marginBottom: 14 }}
          onFocus={handleFocus} onBlur={handleBlur} autoComplete="email" />
        <FieldLabel>Mot de passe</FieldLabel>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input type={showPassword ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            style={{ ...inputStyle, paddingRight: 40 }}
            onFocus={handleFocus} onBlur={handleBlur} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MUTED }}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>8 caractères min. · 1 majuscule · 1 chiffre</p>
        {error && <p style={{ fontSize: 12, color: "var(--false-text)", marginBottom: 8 }}>{error}</p>}
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
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 20 }}>Votre profil professeur 👩‍🏫</p>
        <FieldLabel>Matière enseignée (optionnel)</FieldLabel>
        <input type="text" value={teacherSubject} onChange={e => setTeacherSubject(e.target.value)}
          placeholder="Ex. : Anglais, Espagnol, Latin…" style={{ ...inputStyle, marginBottom: 14 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <FieldLabel>Établissement (optionnel)</FieldLabel>
        <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)}
          placeholder="Ex. : Lycée Victor Hugo, Paris" style={{ ...inputStyle, marginBottom: 4 }}
          onFocus={handleFocus} onBlur={handleBlur} />
        <CTA onClick={() => setProfStep("institution")}>Continuer →</CTA>
        <SkipLink onClick={() => setProfStep("institution")} />
      </>,
      3, 5
    );

    if (profStep === "institution") return wrap(
      <>
        <BackBtn onClick={() => setProfStep("teacher")} />
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 6 }}>Code institution</p>
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Si votre établissement a souscrit à {BRAND_NAME}, saisissez le code fourni par votre administration.</p>
        <FieldLabel>Code institution (optionnel)</FieldLabel>
        <input type="text" value={institutionCode} onChange={e => setInstitutionCode(e.target.value.toUpperCase())}
          placeholder="Ex. : LVH-2025" style={{ ...inputStyle, letterSpacing: "0.1em", marginBottom: 4 }}
          onFocus={handleFocus} onBlur={handleBlur} maxLength={20} />
        <p style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Le code débloque l&apos;accès premium pour votre établissement.</p>
        <CTA onClick={() => setProfStep("promise")}>Continuer →</CTA>
        <SkipLink onClick={() => setProfStep("promise")} />
      </>,
      4, 5
    );

    if (profStep === "promise") return wrap(
      <>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>👩‍🏫</div>
          <p style={{ fontSize: 17, fontWeight: 500, color: TEXT, marginBottom: 6 }}>Tout ce que vous pourrez faire avec {BRAND_NAME}</p>
          <p style={{ fontSize: 13, color: MUTED }}>En un trimestre avec vos élèves</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            { icon: "📝", title: "Créer vos listes de vocabulaire", sub: "En quelques clics, depuis un PDF ou une URL", color: V, bg: V_LIGHT },
            { icon: "👥", title: "Suivre la progression de vos élèves", sub: "Statistiques par élève et par liste", color: GREEN, bg: GREEN_LIGHT },
            { icon: "📅", title: "Assigner des révisions ciblées", sub: "Programmez des sessions adaptées", color: "var(--ink)", bg: GOLD_LIGHT },
          ].map(item => (
            <div key={item.title} style={{ background: item.bg, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: item.color, marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: MUTED }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
        {error && <p style={{ fontSize: 12, color: "var(--false-text)", marginBottom: 8 }}>{error}</p>}
        <CTA onClick={handleRegister} disabled={loading} gold>
          {loading ? "Création du compte…" : "C'est parti ! 🎉"}
        </CTA>
        <p style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 10 }}>Compte gratuit · Sans engagement</p>
      </>,
      5, 5
    );
  }

  return null;
}
