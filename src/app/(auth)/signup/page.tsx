"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff, LogIn, ChevronLeft } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "collegien", label: "Collégien", role: "etudiant" as const },
  { value: "lyceen", label: "Lycéen", role: "etudiant" as const },
  { value: "etudiant", label: "Étudiant", role: "etudiant" as const },
  { value: "professeur", label: "Professeur", role: "professeur" as const },
];

const LANG_OPTIONS = [
  { value: "fra", label: "Français" },
  { value: "eng", label: "Anglais" },
  { value: "spa", label: "Espagnol" },
  { value: "deu", label: "Allemand" },
  { value: "ita", label: "Italien" },
  { value: "por", label: "Portugais" },
  { value: "ara", label: "Arabe" },
  { value: "zho", label: "Chinois" },
  { value: "rus", label: "Russe" },
  { value: "jpn", label: "Japonais" },
];

const MOTIVATION_OPTIONS = [
  { value: "examen", label: "📝 Examen" },
  { value: "voyage", label: "✈️ Voyage" },
  { value: "lecture", label: "📚 Lecture" },
  { value: "travail", label: "💼 Travail" },
  { value: "plaisir", label: "🎯 Plaisir" },
];

const WEEKLY_GOAL_OPTIONS = [
  { value: "5", label: "5 mots" },
  { value: "10", label: "10 mots" },
  { value: "20", label: "20 mots" },
  { value: "50", label: "50 mots" },
  { value: "100", label: "100 mots" },
];

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.97-6.19a24.01 24.01 0 0 0 0 21.56l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const FEATURE_CHIPS = [
  { emoji: "⚡", label: "SM-2" },
  { emoji: "🐾", label: "Mots sauvages" },
  { emoji: "🔥", label: "Streaks" },
  { emoji: "🌍", label: "Multi-langues" },
];

type Step = 0 | 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<string>("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [motivations, setMotivations] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState("");
  /** Inscription professeur : champs optionnels (étape unique après le profil). */
  const [teacherSubject, setTeacherSubject] = useState("");
  const [teacherSchoolName, setTeacherSchoolName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProfileRole = STATUS_OPTIONS.find((s) => s.value === status)?.role;
  const isProfessor = selectedProfileRole === "professeur";

  useEffect(() => {
    if (step === 3 && isProfessor) setStep(2);
  }, [step, isProfessor]);

  /** Après l’étape compte : 2 étapes (profil + enseignant) ou 3 (profil + langues + motivation). */
  const onboardingTotalSteps =
    step >= 1 && status ? (isProfessor ? 2 : 3) : 3;
  const onboardingProgressIndex =
    step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 3 : 0;

  const toggleMulti = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(value)) setter(list.filter((v) => v !== value));
    else setter([...list, value]);
  };

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const role = STATUS_OPTIONS.find((s) => s.value === status)?.role ?? "etudiant";
      const basePayload = {
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim() || undefined,
        role,
      };
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          role === "professeur"
            ? {
                ...basePayload,
                subject: teacherSubject.trim() || undefined,
                school_name: teacherSchoolName.trim() || undefined,
              }
            : {
                ...basePayload,
                nativeLanguage: nativeLanguage || undefined,
                learningLanguages:
                  learningLanguages.length > 0 ? learningLanguages : undefined,
                motivations: motivations.length > 0 ? motivations : undefined,
                weeklyGoal: weeklyGoal || undefined,
              }
        ),
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
        setError("Compte créé. Connecte-toi avec ton email et mot de passe.");
        setLoading(false);
        return;
      }
      if (learningLanguages.length > 0) {
        await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredLanguages: learningLanguages }),
        });
      }
      router.push("/app");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 320, margin: "0 auto" }}>
      {/* Progress bar (steps 1-3) */}
      {step >= 1 && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1" style={{ height: 4, background: "rgba(108,63,200,0.12)", borderRadius: 3 }}>
            <div
              style={{
                height: "100%",
                borderRadius: 3,
                background: "#6C3FC8",
                width: `${(onboardingProgressIndex / onboardingTotalSteps) * 100}%`,
                transition: "width 300ms",
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#6C3FC8" }}>
            {onboardingProgressIndex}/{onboardingTotalSteps}
          </span>
        </div>
      )}

      <div
        style={{
          background: "white",
          borderRadius: 16,
          width: "100%",
          padding: "26px 22px",
          border: "0.5px solid rgba(108,63,200,0.15)",
        }}
      >
        {/* =================== Step 0 — Compte =================== */}
        {step === 0 && (
          <>
            {/* Logo */}
            <div className="mb-[18px] text-center">
              <Link href="/" className="inline-block no-underline">
                <div
                  className="mx-auto mb-2 flex items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "#F0EDF8",
                    border: "1.5px solid #DDD6F5",
                  }}
                >
                  <BookOpen size={26} stroke="#6C3FC8" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 500, color: "#6C3FC8", marginBottom: 2 }}>
                  LEXIVA
                </p>
                <p style={{ fontSize: 11, color: "#71717a" }}>
                  Apprends le vocabulaire autrement
                </p>
              </Link>
            </div>

            <p className="mb-4" style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a" }}>
              Crée ton compte 🎉
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                if (!email.trim() || !password) {
                  setError("Email et mot de passe requis");
                  return;
                }
                setStep(1);
              }}
            >
              <FieldLabel>Email</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ton@email.com"
                className="mb-3 w-full transition-colors"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              <FieldLabel>Mot de passe</FieldLabel>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full transition-colors"
                  style={{ ...inputStyle, paddingRight: 36 }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center"
                  style={{ right: 10, background: "none", border: "none", cursor: "pointer", color: "#a1a1aa" }}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p style={{ fontSize: 10, color: "#a1a1aa", marginTop: 4, marginBottom: 8 }}>
                8 caractères min. · 1 majuscule · 1 chiffre
              </p>

              {error && (
                <p className="mb-2" style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-[7px] transition active:scale-[0.98]"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  padding: 11,
                  borderRadius: 20,
                  border: "none",
                  background: "#6C3FC8",
                  color: "white",
                  cursor: "pointer",
                  margin: "16px 0 12px",
                }}
              >
                <LogIn size={12} stroke="white" />
                Créer mon compte
              </button>
            </form>

            {/* Séparateur */}
            <div className="mb-[10px] flex items-center gap-[10px]">
              <div className="flex-1" style={{ height: 0.5, background: "#e4e4e7" }} />
              <span style={{ fontSize: 11, color: "#a1a1aa" }}>ou</span>
              <div className="flex-1" style={{ height: 0.5, background: "#e4e4e7" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              className="mb-3.5 flex w-full items-center justify-center gap-2 transition hover:brightness-95"
              style={{
                fontSize: 12,
                padding: 9,
                borderRadius: 10,
                border: "1.5px solid #e4e4e7",
                background: "white",
                color: "#1a1a1a",
                cursor: "pointer",
              }}
            >
              <GoogleIcon />
              Continuer avec Google
            </button>

            {/* Lien login */}
            <p className="mb-3.5 text-center" style={{ fontSize: 12, color: "#71717a" }}>
              Déjà un compte ?{" "}
              <Link href="/login" className="no-underline" style={{ fontWeight: 500, color: "#6C3FC8" }}>
                Se connecter
              </Link>
            </p>

            {/* Chips */}
            <div style={{ borderTop: "0.5px solid #e4e4e7", paddingTop: 12 }}>
              <div className="flex flex-wrap justify-center gap-[5px]">
                {FEATURE_CHIPS.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-[3px]"
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: "2px 7px",
                      borderRadius: 8,
                      background: "#F0EDF8",
                      color: "#4B3A9E",
                    }}
                  >
                    {c.emoji} {c.label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* =================== Step 1 — Profil =================== */}
        {step === 1 && (
          <>
            <BackButton onClick={() => setStep(0)} />
            <StepTitle>Ton profil</StepTitle>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!status) { setError("Choisis ton statut"); return; }
                setError("");
                setStep(2);
              }}
            >
              <FieldLabel>Prénom</FieldLabel>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                placeholder="Comment on t'appelle ?"
                className="mb-4 w-full transition-colors"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              <FieldLabel>Tu es…</FieldLabel>
              <div className="mb-3 flex flex-wrap gap-[6px]">
                {STATUS_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt.value}
                    selected={status === opt.value}
                    onClick={() => setStatus(opt.value)}
                  >
                    {opt.label}
                  </ChipButton>
                ))}
              </div>

              {error && <p className="mb-2" style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>}

              <StepSubmitButton>Continuer →</StepSubmitButton>
            </form>
          </>
        )}

        {/* =================== Step 2 — Profil enseignant (prof.) ou Langues (élève) =================== */}
        {step === 2 && isProfessor && (
          <>
            <BackButton onClick={() => setStep(1)} />
            <StepTitle>Votre profil enseignant</StepTitle>
            <form onSubmit={handleFinalSubmit}>
              <FieldLabel>Matière enseignée (optionnel)</FieldLabel>
              <input
                type="text"
                value={teacherSubject}
                onChange={(e) => setTeacherSubject(e.target.value)}
                autoComplete="off"
                placeholder="Ex. : Anglais, Espagnol, Latin…"
                className="mb-4 w-full transition-colors"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              <FieldLabel>Nom de l&apos;établissement (optionnel)</FieldLabel>
              <input
                type="text"
                value={teacherSchoolName}
                onChange={(e) => setTeacherSchoolName(e.target.value)}
                autoComplete="organization"
                placeholder="Ex. : Lycée Victor Hugo, Paris"
                className="mb-3 w-full transition-colors"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              {error && <p className="mb-2" style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-[7px] transition active:scale-[0.98] disabled:opacity-50"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  padding: 11,
                  borderRadius: 20,
                  border: "none",
                  background: "#6C3FC8",
                  color: "white",
                  cursor: "pointer",
                  marginTop: 12,
                }}
              >
                {loading ? "Création du compte…" : "Commencer →"}
              </button>
            </form>
          </>
        )}

        {step === 2 && !isProfessor && (
          <>
            <BackButton onClick={() => setStep(1)} />
            <StepTitle>Langues</StepTitle>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                setStep(3);
              }}
            >
              <FieldLabel>Langue maternelle</FieldLabel>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="mb-4 w-full transition-colors"
                style={inputStyle}
              >
                <option value="">— Choisir —</option>
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <FieldLabel>Langue(s) à apprendre</FieldLabel>
              <div className="mb-3 flex flex-wrap gap-[6px]">
                {LANG_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt.value}
                    selected={learningLanguages.includes(opt.value)}
                    onClick={() => toggleMulti(opt.value, learningLanguages, setLearningLanguages)}
                  >
                    {opt.label}
                  </ChipButton>
                ))}
              </div>

              <StepSubmitButton>Continuer →</StepSubmitButton>
            </form>
          </>
        )}

        {/* =================== Step 3 — Motivation (élèves uniquement) =================== */}
        {step === 3 && !isProfessor && (
          <>
            <BackButton onClick={() => setStep(2)} />
            <StepTitle>Motivation</StepTitle>
            <form onSubmit={handleFinalSubmit}>
              <FieldLabel>Pourquoi tu apprends ?</FieldLabel>
              <div className="mb-4 flex flex-wrap gap-[6px]">
                {MOTIVATION_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt.value}
                    selected={motivations.includes(opt.value)}
                    onClick={() => toggleMulti(opt.value, motivations, setMotivations)}
                  >
                    {opt.label}
                  </ChipButton>
                ))}
              </div>

              <FieldLabel>Objectif hebdomadaire</FieldLabel>
              <div className="mb-3 flex flex-wrap gap-[6px]">
                {WEEKLY_GOAL_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt.value}
                    selected={weeklyGoal === opt.value}
                    onClick={() => setWeeklyGoal(opt.value)}
                  >
                    {opt.label}
                  </ChipButton>
                ))}
              </div>

              {error && <p className="mb-2" style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-[7px] transition active:scale-[0.98] disabled:opacity-50"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  padding: 11,
                  borderRadius: 20,
                  border: "none",
                  background: "#6C3FC8",
                  color: "white",
                  cursor: "pointer",
                  marginTop: 12,
                }}
              >
                {loading ? "Création du compte…" : "Commencer Lexiva 🚀"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Lien login pour steps 1-2 (élève) ou 1 seul intermédiaire (prof : étape 2 = dernière avant submit) */}
      {step > 0 && step < 3 && (
        <p className="mt-4 text-center" style={{ fontSize: 12, color: "#71717a" }}>
          Déjà un compte ?{" "}
          <Link href="/login" className="no-underline" style={{ fontWeight: 500, color: "#6C3FC8" }}>
            Se connecter
          </Link>
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const inputStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid #e4e4e7",
  background: "#FAFAFA",
  color: "#1a1a1a",
  outline: "none",
  width: "100%",
};

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#6C3FC8";
  e.currentTarget.style.background = "white";
}

function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#e4e4e7";
  e.currentTarget.style.background = "#FAFAFA";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#71717a",
        marginBottom: 5,
      }}
    >
      {children}
    </p>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 flex items-center gap-1 transition hover:opacity-70"
      style={{ fontSize: 12, color: "#71717a", background: "none", border: "none", cursor: "pointer" }}
    >
      <ChevronLeft size={14} stroke="#71717a" />
      Retour
    </button>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4" style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a" }}>
      {children}
    </p>
  );
}

function StepSubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-[7px] transition active:scale-[0.98]"
      style={{
        fontSize: 13,
        fontWeight: 500,
        padding: 11,
        borderRadius: 20,
        border: "none",
        background: "#6C3FC8",
        color: "white",
        cursor: "pointer",
        marginTop: 12,
      }}
    >
      {children}
    </button>
  );
}

function ChipButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 12,
        fontWeight: 500,
        padding: "6px 14px",
        borderRadius: 10,
        border: `1.5px solid ${selected ? "#6C3FC8" : "#e4e4e7"}`,
        background: selected ? "#F0EDF8" : "white",
        color: selected ? "#6C3FC8" : "#52525b",
        cursor: "pointer",
        transition: "border-color 120ms, background 120ms, color 120ms",
      }}
    >
      {children}
    </button>
  );
}
