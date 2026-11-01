"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { FloatingWords } from "@/components/auth/floating-words";
import { AuthAlert } from "@/components/auth/auth-alert";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setErrorMsg("Une erreur est survenue, réessaie.");
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center text-center">
        <Logo size="auth" className="mb-4" />
        <div className="auth-status auth-status-false mb-2 w-full" role="alert">
          <CircleAlert size={28} strokeWidth={1.8} aria-hidden />
          <p>Lien invalide ou manquant.</p>
        </div>
        <Link href="/forgot-password" className="auth-link text-sm">
          Faire une nouvelle demande
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <Logo size="auth" className="mb-3" />
        <h1 className="auth-step-title">Nouveau mot de passe</h1>
      </div>

      {status === "success" ? (
        <div className="auth-status auth-status-just" role="status">
          <CircleCheck size={28} strokeWidth={1.8} aria-hidden />
          <p>Ton mot de passe a été réinitialisé ! Tu vas être redirigé vers la connexion...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="auth-label" htmlFor="reset-password">
              Nouveau mot de passe
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="auth-field"
            />
          </div>

          <div className="mb-5">
            <label className="auth-label" htmlFor="reset-confirm">
              Confirmer le mot de passe
            </label>
            <input
              id="reset-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Répète ton mot de passe"
              className="auth-field"
            />
          </div>

          {(status === "error" || errorMsg) && <AuthAlert className="mb-4">{errorMsg}</AuthAlert>}

          <button type="submit" disabled={status === "loading"} className="auth-submit">
            {status === "loading" ? "Enregistrement..." : "Enregistrer le mot de passe"}
          </button>

          <div className="mt-4 flex justify-center">
            <Link href="/login" className="auth-link text-sm">
              ← Retour à la connexion
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <FloatingWords>
      <div className="auth-card">
        <Suspense fallback={<p className="text-center text-sm text-ink">Chargement...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </FloatingWords>
  );
}
