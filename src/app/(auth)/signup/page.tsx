"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

type Step = 0 | 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<string>("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [motivations, setMotivations] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleMulti = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const role = STATUS_OPTIONS.find((s) => s.value === status)?.role ?? "etudiant";
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim() || undefined,
          role,
          nativeLanguage: nativeLanguage || undefined,
          learningLanguages: learningLanguages.length > 0 ? learningLanguages : undefined,
          motivations: motivations.length > 0 ? motivations : undefined,
          weeklyGoal: weeklyGoal || undefined,
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
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
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

  const progressSteps = step >= 1 ? Math.min(step, 3) : 0;
  const progressLabel = progressSteps > 0 ? `${progressSteps}/3` : "";

  return (
    <div className="mx-auto w-full max-w-md">
      {step >= 1 && (
        <div className="mb-6 flex items-center justify-between">
          <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(progressSteps / 3) * 100}%` }}
            />
          </div>
          <span className="ml-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            {progressLabel}
          </span>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
        {step === 0 && (
          <>
            <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
              Crée ton compte
            </h1>
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
              className="flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  8 caractères min. · 1 majuscule · 1 chiffre
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                className="btn-relief w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:bg-primary-dark"
              >
                Continuer →
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline dark:text-primary-light"
              >
                Se connecter
              </Link>
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← Retour
            </button>
            <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
              Ton profil
            </h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!status) {
                  setError("Choisis ton statut");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Comment on t'appelle ?"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <p className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Tu es…
                </p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${
                        status === opt.value
                          ? "border-primary bg-primary/10 text-primary dark:border-primary-light dark:bg-primary/20 dark:text-primary-light"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                className="btn-relief w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:bg-primary-dark"
              >
                Continuer →
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← Retour
            </button>
            <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
              Langues
            </h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                setStep(3);
              }}
              className="flex flex-col gap-6"
            >
              <div>
                <label
                  htmlFor="nativeLang"
                  className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Quelle est ta langue maternelle ?
                </label>
                <select
                  id="nativeLang"
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">— Choisir —</option>
                  {LANG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Quelle(s) langue(s) veux-tu apprendre ?
                </p>
                <div className="flex flex-wrap gap-2">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        toggleMulti(opt.value, learningLanguages, setLearningLanguages)
                      }
                      className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${
                        learningLanguages.includes(opt.value)
                          ? "border-primary bg-primary/10 text-primary dark:border-primary-light dark:bg-primary/20 dark:text-primary-light"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="btn-relief w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:bg-primary-dark"
              >
                Continuer →
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← Retour
            </button>
            <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
              Motivation
            </h1>
            <form
              onSubmit={handleFinalSubmit}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pourquoi tu apprends ?
                </p>
                <div className="flex flex-wrap gap-2">
                  {MOTIVATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        toggleMulti(opt.value, motivations, setMotivations)
                      }
                      className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${
                        motivations.includes(opt.value)
                          ? "border-primary bg-primary/10 text-primary dark:border-primary-light dark:bg-primary/20 dark:text-primary-light"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Objectif hebdomadaire
                </p>
                <div className="flex flex-wrap gap-2">
                  {WEEKLY_GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWeeklyGoal(opt.value)}
                      className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${
                        weeklyGoal === opt.value
                          ? "border-primary bg-primary/10 text-primary dark:border-primary-light dark:bg-primary/20 dark:text-primary-light"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-relief w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? "Création du compte…" : "Commencer Lexiva 🚀"}
              </button>
            </form>
          </>
        )}
      </div>

      {step > 0 && step < 3 && (
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline dark:text-primary-light"
          >
            Se connecter
          </Link>
        </p>
      )}
    </div>
  );
}
