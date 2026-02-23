"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import type { ProfileStatus } from "@/app/api/user/profile/route";
import { BackLink } from "@/components/back-link";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { PhoneInput } from "@/components/phone-input";

const STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: "etudiant", label: "Étudiant" },
  { value: "salarie", label: "Salarié" },
  { value: "independant", label: "Indépendant" },
  { value: "en_formation", label: "En formation" },
];

type UserRole = "etudiant" | "professeur";
type Step = 0 | 1 | 2 | 3;

export default function SignupPage() {
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<UserRole | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<ProfileStatus | "">("");
  const [institutionName, setInstitutionName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          role: role ?? "etudiant",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Inscription impossible.");
        setLoading(false);
        return;
      }
      await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      setStep(2);
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          dateOfBirth: dateOfBirth.trim() || null,
          city: city.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      if (!res.ok) {
        setError("Erreur lors de l’enregistrement.");
        setLoading(false);
        return;
      }
      setStep(3);
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status || null,
          institutionName: institutionName.trim() || null,
        }),
      });
      if (!res.ok) {
        setError("Erreur lors de l’enregistrement.");
        setLoading(false);
        return;
      }
      window.location.href = role === "professeur" ? "/app/professeur" : "/app";
      return;
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Étape 0 : Choix Étudiant / Professeur */}
      {step === 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
          <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
            Inscription
          </h1>
          <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Tu es étudiant ou professeur ?
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setRole("etudiant");
                setStep(1);
              }}
              className="btn-relief rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
            >
              <span className="text-2xl" aria-hidden>📚</span>
              <h2 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
                Étudiant
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Apprendre du vocabulaire, réviser, suivre ma progression.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("professeur");
                setStep(1);
              }}
              className="btn-relief rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
            >
              <span className="text-2xl" aria-hidden>👩‍🏫</span>
              <h2 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
                Professeur
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Créer des classes, déposer des listes, suivre mes élèves.
              </p>
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline dark:text-primary-light"
            >
              Se connecter
            </Link>
          </p>
        </div>
      )}

      {step === 1 && (
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
        <BackLink href="#" onClick={() => setStep(0)} ariaLabel="Retour au choix" />
        <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
          Inscription
        </h1>

        {/* Étape 1 : Nom, Prénom, Email, Mot de passe */}
          <form onSubmit={handleStep1} className="flex flex-col gap-4">
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
              >
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
              >
                Adresse mail
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
                Mot de passe (8 caractères min.)
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
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-relief mt-2 w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? "Inscription…" : "Continuer"}
            </button>
          </form>

        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline dark:text-primary-light"
          >
            Se connecter
          </Link>
        </p>
      </div>
      )}

      {/* Modale étape 2 : Date de naissance, Ville, Téléphone */}
      {step === 2 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-step2-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <BackLink href="#" onClick={() => setStep(1)} ariaLabel="Retour à l'étape précédente" />
            <h2
              id="modal-step2-title"
              className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100"
            >
              À propos de vous
            </h2>
            <form onSubmit={handleStep2} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Date de naissance
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  autoComplete="bday"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Ville
                </label>
                <CityAutocomplete
                  id="city"
                  value={city}
                  onChange={setCity}
                  placeholder="Commencez à taper pour rechercher…"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Numéro de téléphone
                </label>
                <PhoneInput
                  id="phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="6 12 34 56 78"
                  disabled={loading}
                  className="w-full"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-relief mt-2 w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? "Enregistrement…" : "Continuer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modale étape 3 : Statut, Nom de l'établissement */}
      {step === 3 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-step3-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <BackLink href="#" onClick={() => setStep(2)} ariaLabel="Retour à l'étape précédente" />
            <h2
              id="modal-step3-title"
              className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100"
            >
              Votre situation
            </h2>
            <form onSubmit={handleStep3} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="status"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Statut
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) =>
                    setStatus((e.target.value || "") as ProfileStatus | "")
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">— Choisir —</option>
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="institutionName"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Nom de l&apos;établissement
                </label>
                <input
                  id="institutionName"
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="École, entreprise, organisme de formation…"
                  autoComplete="organization"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-relief mt-2 w-full rounded-lg bg-primary py-2.5 font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? "Enregistrement…" : "Terminer l'inscription"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
