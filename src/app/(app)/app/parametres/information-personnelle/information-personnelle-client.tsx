"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { PhoneInput } from "@/components/phone-input";
const ROLE_OPTIONS: { value: "etudiant" | "professeur"; label: string }[] = [
  { value: "etudiant", label: "Élève" },
  { value: "professeur", label: "Professeur" },
];

type ProfileForm = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  city: string;
  phone: string;
  role: "etudiant" | "professeur" | "";
  institutionName: string;
};

export type InitialProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  role: "etudiant" | "professeur" | null;
  institutionName: string;
  city: string;
  dateOfBirth: string;
  phone: string;
};

export function InformationPersonnelleClient({
  initialData,
}: {
  initialData?: InitialProfileData;
}) {
  const [form, setForm] = useState<ProfileForm>({
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    dateOfBirth: initialData?.dateOfBirth ?? "",
    city: initialData?.city ?? "",
    phone: initialData?.phone ?? "",
    role: initialData?.role ?? "",
    institutionName: initialData?.institutionName ?? "",
  });
  const [email, setEmail] = useState<string | null>(initialData?.email ?? null);
  const [loaded, setLoaded] = useState(!!initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "error">("idle");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (initialData) return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setForm({
          firstName: d.firstName ?? "",
          lastName: d.lastName ?? "",
          dateOfBirth: d.dateOfBirth ?? "",
          city: d.city ?? "",
          phone: d.phone ?? "",
          role: d.role ?? "",
          institutionName: d.institutionName ?? "",
        });
        setEmail(d.email ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [initialData]);

  const update = (updates: Partial<ProfileForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setMessage(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = {
      firstName: form.firstName.trim() || null,
      lastName: form.lastName.trim() || null,
      dateOfBirth: form.dateOfBirth.trim() || null,
      city: form.city.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role || null,
      institutionName: form.institutionName.trim() || null,
    };
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (r.ok) setMessage("saved");
        else setMessage("error");
      })
      .catch(() => setMessage("error"))
      .finally(() => setSaving(false));
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <BackLink href="/app/parametres" />

      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Information personnelle
      </h1>

      {!loaded ? (
        <p className="text-slate-500 dark:text-slate-400">Chargement…</p>
      ) : (
        <form
          onSubmit={submit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Prénom
              </span>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update({ firstName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                autoComplete="given-name"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nom
              </span>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update({ lastName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                autoComplete="family-name"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Date de naissance
            </span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update({ dateOfBirth: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              autoComplete="bday"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Ville
            </span>
            <CityAutocomplete
              value={form.city}
              onChange={(v) => update({ city: v })}
              placeholder="Commencez à taper pour rechercher…"
              disabled={saving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Numéro de téléphone
            </span>
            <PhoneInput
              value={form.phone}
              onChange={(v) => update({ phone: v })}
              placeholder="6 12 34 56 78"
              disabled={saving}
              className="w-full"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Adresse mail
            </span>
            <input
              type="email"
              value={email ?? ""}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
              aria-describedby="email-readonly"
            />
            <p id="email-readonly" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              L’adresse mail est celle de ton compte ; elle ne peut pas être modifiée ici.
            </p>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Statut
            </span>
            <select
              value={form.role}
              onChange={(e) =>
                update({ role: (e.target.value || "") as ProfileForm["role"] })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="">— Choisir —</option>
              {ROLE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nom de l’établissement
            </span>
            <input
              type="text"
              value={form.institutionName}
              onChange={(e) => update({ institutionName: e.target.value })}
              placeholder="École, entreprise, organisme de formation…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
              autoComplete="organization"
            />
          </label>

          {message === "saved" && (
            <p className="rounded-lg bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
              ✅ Informations mises à jour !
            </p>
          )}
          {message === "error" && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              Erreur lors de l’enregistrement.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}

      {loaded && (
        <>
          <hr className="border-slate-200 dark:border-slate-700" />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmEmail("");
                setDeleteStatus("idle");
                setDeleteError("");
                setDeleteModalOpen(true);
              }}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Supprimer mon compte
            </button>
          </div>
        </>
      )}

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => deleteStatus !== "loading" && setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Supprimer mon compte
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Cette action est irréversible. Toutes vos données seront
              définitivement supprimées : listes, mots, révisions, progression.
            </p>

            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pour confirmer, saisissez votre adresse email :
              </span>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={email ?? ""}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            {deleteStatus === "error" && deleteError && (
              <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteStatus === "loading"}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={
                  deleteStatus === "loading" ||
                  !email ||
                  deleteConfirmEmail.trim().toLowerCase() !== email.toLowerCase()
                }
                onClick={async () => {
                  setDeleteStatus("loading");
                  setDeleteError("");
                  try {
                    const res = await fetch("/api/user/delete", {
                      method: "DELETE",
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.success) {
                      router.push("/?deleted=true");
                    } else {
                      setDeleteError(
                        data.error || "Erreur lors de la suppression."
                      );
                      setDeleteStatus("error");
                    }
                  } catch {
                    setDeleteError("Erreur réseau, réessaie.");
                    setDeleteStatus("error");
                  }
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteStatus === "loading"
                  ? "Suppression…"
                  : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
