"use client";

import { useState, useEffect } from "react";
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
    </div>
  );
}
