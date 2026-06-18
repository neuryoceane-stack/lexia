"use client";

import { useState } from "react";
import type { CSSProperties, FocusEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";

type Role = "eleve" | "professeur";
type Plan = "free" | "monthly" | "annual";

type EleveStep =
  | "role"
  | "source"
  | "goal"
  | "streak"
  | "identity"
  | "account"
  | "projection"
  | "pricing";

type ProfStep =
  | "role"
  | "identity"
  | "account"
  | "teacher"
  | "institution"
  | "promise";

const ACQUISITION_OPTIONS = [
  { value: "prof", label: "Recommandation d'un professeur", icon: "👩‍🏫" },
  { value: "social", label: "Réseaux sociaux", icon: "📱" },
  { value: "google", label: "Recherche Google", icon: "🔍" },
  { value: "bouche_a_oreille", label: "Bouche à oreille", icon: "💬" },
  { value: "autre", label: "Autre", icon: "✦" },
];

const GOAL_OPTIONS = [
  { value: 5, label: "5 mots", sub: "Pour commencer en douceur" },
  { value: 10, label: "10 mots", sub: "Régulier et efficace" },
  { value: 20, label: "20 mots", sub: "Ambitieux" },
  { value: 50, label: "50 mots", sub: "Mode champion" },
];

const STREAK_OPTIONS = [
  { value: 7, label: "7 jours", sub: "Un bon début" },
  { value: 14, label: "14 jours", sub: "Régulier" },
  { value: 30, label: "30 jours", sub: "Ambitieux" },
  { value: 50, label: "50 jours", sub: "Champion !" },
];

const V = "#6C3FC8";
const V_LIGHT = "#F0EDF8";
const V_BORDER = "rgba(108,63,200,0.18)";
const GOLD = "#F5A623";
const GOLD_LIGHT = "#FEF4E0";
const GREEN = "#1D9E75";
const GREEN_LIGHT = "#E1F5EE";
const FOND = "#F8F7FF";
const TEXT = "#1A1033";
const MUTED = "#7C6FA3";

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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED, marginBottom: 6 }}>
      {children}
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
        background: gold ? GOLD : V, color: "white", fontSize: 14, fontWeight: 500,
        cursor: "pointer", marginTop: 16, fontFamily: "DM Sans, sans-serif",
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

function SorcierEleve() {
  return (
    <svg viewBox="0 0 130 180" width="100%" style={{ maxWidth: 110, display: "block", margin: "0 auto 10px" }} xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="30" fontSize="10" fill="#F5A623" opacity="0.8">✦</text>
      <text x="110" y="45" fontSize="8" fill="#6C3FC8" opacity="0.7">✦</text>
      <text x="8" y="90" fontSize="7" fill="#1D9E75" opacity="0.6">✦</text>
      <polygon points="65,8 30,65 100,65" fill="#6C3FC8"/>
      <polygon points="65,8 30,65 65,45 100,65" fill="#5030A8" opacity="0.3"/>
      <rect x="22" y="62" width="86" height="11" rx="5.5" fill="#5030A8"/>
      <polygon points="65,22 68,32 78,32 70,38 73,48 65,42 57,48 60,38 52,32 62,32" fill="#F5A623"/>
      <rect x="58" y="103" width="14" height="10" rx="3" fill="#FDDBB4"/>
      <ellipse cx="65" cy="90" rx="27" ry="27" fill="#FDDBB4"/>
      <ellipse cx="38" cy="90" rx="5" ry="7" fill="#F5C8A0"/>
      <ellipse cx="92" cy="90" rx="5" ry="7" fill="#F5C8A0"/>
      <ellipse cx="38" cy="90" rx="3" ry="5" fill="#FDDBB4"/>
      <ellipse cx="92" cy="90" rx="3" ry="5" fill="#FDDBB4"/>
      <path d="M38 78 Q65 60 92 78 Q90 63 65 58 Q40 63 38 78Z" fill="#4A3728"/>
      <path d="M38 78 Q35 72 36 66 Q42 58 50 60" fill="#4A3728"/>
      <path d="M92 78 Q95 72 94 66 Q88 58 80 60" fill="#4A3728"/>
      <ellipse cx="54" cy="88" rx="5.5" ry="6" fill="white"/>
      <ellipse cx="76" cy="88" rx="5.5" ry="6" fill="white"/>
      <ellipse cx="55" cy="89" rx="4" ry="4.5" fill="#2D1B69"/>
      <ellipse cx="77" cy="89" rx="4" ry="4.5" fill="#2D1B69"/>
      <ellipse cx="56" cy="87" rx="1.5" ry="2" fill="white"/>
      <ellipse cx="78" cy="87" rx="1.5" ry="2" fill="white"/>
      <path d="M48 81 Q54 78 60 80" stroke="#4A3728" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M70 80 Q76 78 82 81" stroke="#4A3728" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <ellipse cx="65" cy="95" rx="3" ry="2" fill="#F5C8A0"/>
      <path d="M53 101 Q65 111 77 101" stroke="#4A3728" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <ellipse cx="45" cy="97" rx="7" ry="5" fill="#F9A8A8" opacity="0.5"/>
      <ellipse cx="85" cy="97" rx="7" ry="5" fill="#F9A8A8" opacity="0.5"/>
      <path d="M38 113 Q42 107 65 105 Q88 107 92 113 L98 175 Q65 180 32 175Z" fill="#6C3FC8"/>
      <rect x="44" y="122" width="38" height="28" rx="5" fill="#F5A623"/>
      <rect x="44" y="122" width="6" height="28" rx="4" fill="#D4881A"/>
      <line x1="56" y1="130" x2="78" y2="130" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="56" y1="135" x2="78" y2="135" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="56" y1="140" x2="72" y2="140" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M38 115 Q28 125 24 135" stroke="#6C3FC8" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <ellipse cx="23" cy="137" rx="5" ry="5" fill="#FDDBB4"/>
      <path d="M92 115 Q102 118 108 112" stroke="#6C3FC8" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <ellipse cx="109" cy="110" rx="5" ry="5" fill="#FDDBB4"/>
      <line x1="112" y1="108" x2="124" y2="90" stroke="#8B6914" strokeWidth="3.5" strokeLinecap="round"/>
      <polygon points="124,90 119,80 129,83" fill="#F5A623"/>
    </svg>
  );
}

function SorcierProf() {
  return (
    <svg viewBox="0 0 130 180" width="100%" style={{ maxWidth: 110, display: "block", margin: "0 auto 10px" }} xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="30" fontSize="10" fill="#1D9E75" opacity="0.8">✦</text>
      <text x="110" y="45" fontSize="8" fill="#F5A623" opacity="0.7">✦</text>
      <text x="8" y="90" fontSize="7" fill="#6C3FC8" opacity="0.6">✦</text>
      <polygon points="65,5 28,65 102,65" fill="#1D9E75"/>
      <polygon points="65,5 28,65 65,42 102,65" fill="#16805F" opacity="0.3"/>
      <rect x="20" y="62" width="90" height="11" rx="5.5" fill="#16805F"/>
      <polygon points="65,20 68,30 78,30 70,36 73,46 65,40 57,46 60,36 52,30 62,30" fill="#F5A623"/>
      <rect x="58" y="103" width="14" height="10" rx="3" fill="#FDDBB4"/>
      <ellipse cx="65" cy="90" rx="27" ry="27" fill="#FDDBB4"/>
      <ellipse cx="38" cy="90" rx="5" ry="7" fill="#F5C8A0"/>
      <ellipse cx="92" cy="90" rx="5" ry="7" fill="#F5C8A0"/>
      <ellipse cx="38" cy="90" rx="3" ry="5" fill="#FDDBB4"/>
      <ellipse cx="92" cy="90" rx="3" ry="5" fill="#FDDBB4"/>
      <path d="M38 78 Q65 62 92 78 Q90 64 65 59 Q40 64 38 78Z" fill="#8A7A6A"/>
      <path d="M38 78 Q35 72 36 66 Q42 58 50 60" fill="#8A7A6A"/>
      <path d="M92 78 Q95 72 94 66 Q88 58 80 60" fill="#8A7A6A"/>
      <circle cx="54" cy="87" r="10" fill="white" opacity="0.9"/>
      <circle cx="76" cy="87" r="10" fill="white" opacity="0.9"/>
      <circle cx="54" cy="87" r="10" fill="none" stroke="#4A3728" strokeWidth="2"/>
      <circle cx="76" cy="87" r="10" fill="none" stroke="#4A3728" strokeWidth="2"/>
      <line x1="44" y1="84" x2="38" y2="82" stroke="#4A3728" strokeWidth="2" strokeLinecap="round"/>
      <line x1="86" y1="84" x2="92" y2="82" stroke="#4A3728" strokeWidth="2" strokeLinecap="round"/>
      <path d="M64 86 Q65 85 66 86" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
      <ellipse cx="54" cy="88" rx="4" ry="4.5" fill="#2D1B69"/>
      <ellipse cx="76" cy="88" rx="4" ry="4.5" fill="#2D1B69"/>
      <ellipse cx="55" cy="86.5" rx="1.5" ry="1.8" fill="white"/>
      <ellipse cx="77" cy="86.5" rx="1.5" ry="1.8" fill="white"/>
      <path d="M44 77 Q54 73 63 76" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M67 76 Q76 73 86 77" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="65" cy="95" rx="3" ry="2" fill="#F5C8A0"/>
      <path d="M52 101 Q58 106 65 103 Q72 106 78 101" stroke="#8A7A6A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M56 106 Q65 112 74 106" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M38 113 Q42 107 65 105 Q88 107 92 113 L98 175 Q65 180 32 175Z" fill="#1D9E75"/>
      <rect x="42" y="118" width="42" height="32" rx="5" fill="white" stroke="#E4E4E7" strokeWidth="1.5"/>
      <rect x="42" y="118" width="42" height="9" rx="5" fill="#E4F5EE"/>
      <line x1="48" y1="133" x2="78" y2="133" stroke="#6C3FC8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="48" y1="138" x2="74" y2="138" stroke="#6C3FC8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="48" y1="143" x2="76" y2="143" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M38 115 Q28 125 24 135" stroke="#1D9E75" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <ellipse cx="23" cy="137" rx="5" ry="5" fill="#FDDBB4"/>
      <path d="M92 115 Q102 118 108 112" stroke="#1D9E75" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <ellipse cx="109" cy="110" rx="5" ry="5" fill="#FDDBB4"/>
      <line x1="112" y1="108" x2="124" y2="90" stroke="#8B6914" strokeWidth="3.5" strokeLinecap="round"/>
      <polygon points="124,90 119,80 129,83" fill="#F5A623"/>
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [eleveStep, setEleveStep] = useState<EleveStep>("role");
  const [profStep, setProfStep] = useState<ProfStep>("role");

  const [acquisitionSource, setAcquisitionSource] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);
  const [streakGoal, setStreakGoal] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");
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
          streak_goal: !isProf ? streakGoal ?? undefined : undefined,
          plan,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Inscription impossible.");
        setLoading(false);
        return;
      }
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!loginRes.ok) {
        setError("Compte créé. Connectez-vous avec votre email et mot de passe.");
        setLoading(false);
        return;
      }
      router.push("/app");
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
      <div style={{ background: "white", borderRadius: 20, padding: "28px 24px", border: `1px solid ${V_BORDER}`, boxShadow: "0 2px 24px rgba(108,63,200,0.07)" }}>
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
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", padding: "0 16px" }}>
        <div style={{
          background: "white", borderRadius: 28, padding: "36px 24px 28px",
          border: "1.5px solid rgba(108,63,200,0.1)",
          boxShadow: "0 8px 40px rgba(108,63,200,0.1)",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 14, left: 20, fontSize: 14, color: GOLD, opacity: 0.6 }}>✦</div>
          <div style={{ position: "absolute", top: 10, right: 24, fontSize: 10, color: V, opacity: 0.5 }}>✦</div>
          <div style={{ position: "absolute", bottom: 80, left: 16, fontSize: 9, color: GREEN, opacity: 0.5 }}>✦</div>
          <div style={{ position: "absolute", bottom: 90, right: 18, fontSize: 11, color: GOLD, opacity: 0.5 }}>✦</div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 500, color: V, letterSpacing: "-1px" }}>LEXIVA</p>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "6px 0 4px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: V }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
            </div>
            <p style={{ fontSize: 12, color: "#9B8EC4", letterSpacing: "0.02em", marginBottom: 28 }}>Apprends le vocabulaire autrement</p>
          </div>

          <p style={{ fontSize: 20, fontWeight: 500, color: TEXT, textAlign: "center", marginBottom: 6 }}>Qui êtes-vous ?</p>
          <p style={{ fontSize: 13, color: MUTED, textAlign: "center", marginBottom: 24 }}>Choisissez votre rôle pour commencer</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <button type="button"
              onClick={() => { setRole("eleve"); setEleveStep("source"); }}
              style={{
                background: "linear-gradient(160deg,#EDE8FA 0%,#E8E2F8 100%)",
                border: "2px solid rgba(108,63,200,0.15)", borderRadius: 22,
                padding: "20px 10px 16px", cursor: "pointer", textAlign: "center",
                transition: "all 0.25s", fontFamily: "DM Sans, sans-serif",
                width: "100%", minWidth: 0,
              }}>
              <div style={{ display: "inline-block", background: V, color: "white", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20, marginBottom: 10 }}>Élève</div>
              <SorcierEleve />
              <p style={{ fontSize: 15, fontWeight: 500, color: V, marginBottom: 3 }}>Élève</p>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>J&apos;apprends du vocabulaire</p>
            </button>

            <button type="button"
              onClick={() => router.push("/signup/professeur")}
              style={{
                background: "linear-gradient(160deg,#E2F5EE 0%,#D8F0E7 100%)",
                border: "2px solid rgba(29,158,117,0.15)", borderRadius: 22,
                padding: "20px 10px 16px", cursor: "pointer", textAlign: "center",
                transition: "all 0.25s", fontFamily: "DM Sans, sans-serif",
                width: "100%", minWidth: 0,
              }}>
              <div style={{ display: "inline-block", background: GREEN, color: "white", fontSize: 10, fontWeight: 500, padding: "3px 10px", borderRadius: 20, marginBottom: 10 }}>Professeur</div>
              <SorcierProf />
              <p style={{ fontSize: 15, fontWeight: 500, color: GREEN, marginBottom: 3 }}>Professeur</p>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>Je crée des listes pour mes élèves</p>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(108,63,200,0.08)" }} />
            <span style={{ fontSize: 11, color: "#C4BBE0", whiteSpace: "nowrap" }}>Bienvenue dans la magie du vocabulaire</span>
            <div style={{ flex: 1, height: 1, background: "rgba(108,63,200,0.08)" }} />
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
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 4 }}>Comment avez-vous entendu parler de Lexiva ?</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>Cela nous aide à améliorer l&apos;application.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACQUISITION_OPTIONS.map(opt => (
            <Card key={opt.value} selected={acquisitionSource === opt.value} onClick={() => setAcquisitionSource(opt.value)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ fontSize: 14, color: TEXT }}>{opt.label}</span>
                {acquisitionSource === opt.value && <span style={{ marginLeft: "auto", color: V, fontSize: 16 }}>✓</span>}
              </div>
            </Card>
          ))}
        </div>
        <CTA onClick={() => setEleveStep("goal")}>Continuer →</CTA>
        <SkipLink onClick={() => setEleveStep("goal")} />
      </>,
      1, 7
    );

    if (eleveStep === "goal") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("source")} />
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 4 }}>Quel est votre objectif de vocabulaire ?</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>Nombre de mots à apprendre par semaine.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GOAL_OPTIONS.map(opt => (
            <Card key={opt.value} selected={weeklyGoal === opt.value} onClick={() => setWeeklyGoal(opt.value)} accent={V}>
              <p style={{ fontSize: 20, fontWeight: 500, color: weeklyGoal === opt.value ? V : TEXT, marginBottom: 2 }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: MUTED }}>{opt.sub}</p>
            </Card>
          ))}
        </div>
        <CTA onClick={() => { if (weeklyGoal) setEleveStep("streak"); }} disabled={!weeklyGoal}>Continuer →</CTA>
        <SkipLink onClick={() => setEleveStep("streak")} />
      </>,
      2, 7
    );

    if (eleveStep === "streak") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("goal")} />
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 4 }}>Quel est votre objectif de série ? 🔥</p>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>Définissez votre ambition dès maintenant.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {STREAK_OPTIONS.map(opt => (
            <Card key={opt.value} selected={streakGoal === opt.value} onClick={() => setStreakGoal(opt.value)} accent={GOLD}>
              <p style={{ fontSize: 20, fontWeight: 500, color: streakGoal === opt.value ? "#B87A10" : TEXT, marginBottom: 2 }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: MUTED }}>{opt.sub}</p>
            </Card>
          ))}
        </div>
        <CTA onClick={() => { if (streakGoal) setEleveStep("identity"); }} disabled={!streakGoal}>Continuer →</CTA>
        <SkipLink onClick={() => setEleveStep("identity")} />
      </>,
      3, 7
    );

    if (eleveStep === "identity") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("streak")} />
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
        <CTA onClick={() => setEleveStep("account")}>Continuer →</CTA>
      </>,
      4, 7
    );

    if (eleveStep === "account") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("identity")} />
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
        {error && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{error}</p>}
        <CTA onClick={() => {
          setError("");
          if (!email.trim() || !password) { setError("Email et mot de passe requis."); return; }
          if (password.length < 8) { setError("Mot de passe trop court (8 car. min.)"); return; }
          setEleveStep("projection");
        }}>Continuer →</CTA>
      </>,
      5, 7
    );

    if (eleveStep === "projection") {
      const mots = calcProjection();
      return wrap(
        <>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🚀</div>
            <p style={{ fontSize: 17, fontWeight: 500, color: TEXT, marginBottom: 6 }}>Voici ce que vous pouvez accomplir en 3 mois</p>
            <p style={{ fontSize: 13, color: MUTED }}>Basé sur votre objectif de {weeklyGoal ?? 10} mots/semaine</p>
          </div>
          <div style={{ background: V_LIGHT, borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 48, fontWeight: 500, color: V, marginBottom: 4 }}>{mots}</p>
            <p style={{ fontSize: 14, color: V }}>mots mémorisés</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div style={{ background: GOLD_LIGHT, borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 500, color: "#B87A10" }}>{streakGoal ?? 14}</p>
              <p style={{ fontSize: 11, color: MUTED }}>jours de série visés</p>
            </div>
            <div style={{ background: GREEN_LIGHT, borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 500, color: GREEN }}>SM-2</p>
              <p style={{ fontSize: 11, color: MUTED }}>algorithme d&apos;apprentissage</p>
            </div>
          </div>
          <CTA onClick={() => setEleveStep("pricing")}>Choisir mon plan →</CTA>
        </>,
        6, 7
      );
    }

    if (eleveStep === "pricing") return wrap(
      <>
        <BackBtn onClick={() => setEleveStep("projection")} />
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, textAlign: "center", marginBottom: 4 }}>Choisissez votre plan</p>
        <p style={{ fontSize: 12, color: MUTED, textAlign: "center", marginBottom: 20 }}>Vous pouvez changer de plan à tout moment.</p>
        <div onClick={() => setPlan("annual")}
          style={{ background: plan === "annual" ? V_LIGHT : "white", border: `2px solid ${plan === "annual" ? V : V_BORDER}`, borderRadius: 16, padding: "16px", marginBottom: 10, cursor: "pointer", position: "relative" }}>
          <div style={{ position: "absolute", top: -10, left: 16, background: V, color: "white", fontSize: 10, fontWeight: 500, padding: "2px 10px", borderRadius: 20 }}>MEILLEURE OFFRE</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Plan annuel</p>
              <p style={{ fontSize: 11, color: MUTED }}>Économisez 40% vs mensuel</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 18, fontWeight: 500, color: V }}>4,99€<span style={{ fontSize: 11, color: MUTED }}>/mois</span></p>
              <p style={{ fontSize: 10, color: MUTED }}>59,88€/an</p>
            </div>
          </div>
        </div>
        <div onClick={() => setPlan("monthly")}
          style={{ background: plan === "monthly" ? V_LIGHT : "white", border: `1.5px solid ${plan === "monthly" ? V : V_BORDER}`, borderRadius: 16, padding: "16px", marginBottom: 10, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>Plan mensuel</p>
              <p style={{ fontSize: 11, color: MUTED }}>Annulable à tout moment</p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: TEXT }}>8,99€<span style={{ fontSize: 11, color: MUTED }}>/mois</span></p>
          </div>
        </div>
        <div onClick={() => setPlan("free")}
          style={{ background: plan === "free" ? GREEN_LIGHT : "white", border: `1.5px solid ${plan === "free" ? GREEN : V_BORDER}`, borderRadius: 16, padding: "14px", marginBottom: 16, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: plan === "free" ? GREEN : MUTED }}>Pas sûr(e) ? Plan gratuit</p>
              <p style={{ fontSize: 11, color: MUTED }}>Fonctionnalités de base, sans CB</p>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: plan === "free" ? GREEN : MUTED }}>Gratuit</p>
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{error}</p>}
        <CTA onClick={handleRegister} disabled={loading} gold={plan !== "free"}>
          {loading ? "Création du compte…" : plan === "free" ? "Commencer gratuitement 🎉" : "Commencer avec Lexiva 🎉"}
        </CTA>
        <p style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 10 }}>
          {plan === "free" ? "Aucune carte bancaire requise." : "Paiement sécurisé · Annulable à tout moment."}
        </p>
      </>,
      7, 7
    );
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
        {error && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{error}</p>}
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
        <p style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 20 }}>Votre profil enseignant 👩‍🏫</p>
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
        <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Si votre établissement a souscrit à Lexiva, saisissez le code fourni par votre administration.</p>
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
          <p style={{ fontSize: 17, fontWeight: 500, color: TEXT, marginBottom: 6 }}>Tout ce que vous pourrez faire avec Lexiva</p>
          <p style={{ fontSize: 13, color: MUTED }}>En un trimestre avec vos élèves</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            { icon: "📝", title: "Créer vos listes de vocabulaire", sub: "En quelques clics, depuis un PDF ou une URL", color: V, bg: V_LIGHT },
            { icon: "👥", title: "Suivre la progression de vos élèves", sub: "Statistiques par élève et par liste", color: GREEN, bg: GREEN_LIGHT },
            { icon: "📅", title: "Assigner des révisions ciblées", sub: "Programmez des sessions adaptées", color: "#B87A10", bg: GOLD_LIGHT },
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
        {error && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{error}</p>}
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
