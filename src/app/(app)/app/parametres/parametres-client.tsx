"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SyntheseAvatar } from "@/components/synthese-avatar";

type AvatarType = "arbre" | "phenix" | "koala";

const AVATAR_OPTIONS: { value: AvatarType; label: string }[] = [
  { value: "arbre", label: "Arbre" },
  { value: "phenix", label: "Phénix" },
  { value: "koala", label: "Koala" },
];

export function ParametresClient() {
  const [avatarType, setAvatarType] = useState<AvatarType>("arbre");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.avatarType && AVATAR_OPTIONS.some((o) => o.value === d.avatarType)) {
          setAvatarType(d.avatarType);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const saveAvatarType = (value: AvatarType) => {
    setAvatarType(value);
    setSaving(true);
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarType: value }),
    })
      .then(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
      >
        ← Retour
      </Link>

      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Paramètres
      </h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
          Avatar (Synthèse)
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choisis le type d&apos;avatar affiché dans la Synthèse. Il évolue selon ton activité.
        </p>
        {loaded && (
          <div className="mt-6 flex flex-wrap gap-6">
            {AVATAR_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => saveAvatarType(value)}
                disabled={saving}
                className={`btn-relief flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  avatarType === value
                    ? "border-p3-turquoise bg-p3-turquoise/10 dark:bg-p3-turquoise/20"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-slate-500"
                }`}
              >
                <SyntheseAvatar
                  state={3}
                  type={value}
                  showLabel={false}
                  className="pointer-events-none"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
