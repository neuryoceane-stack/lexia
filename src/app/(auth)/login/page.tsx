"use client";

import { useState } from "react";
import Link from "next/link";

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }
      window.location.href = "/app";
    } catch {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
      <div className="mb-6 flex flex-col items-center">
        <LogoIcon className="h-10 w-10 text-primary dark:text-primary-light" />
        <span className="mt-2 text-2xl font-semibold text-primary dark:text-primary-light">
          LEXIVA
        </span>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Apprends le vocabulaire autrement
        </p>
      </div>
      <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
        Connexion
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
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
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline dark:text-primary-light"
        >
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
