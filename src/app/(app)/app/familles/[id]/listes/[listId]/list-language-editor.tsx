"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { FlagDisplay } from "@/components/flag-display";

export function ListLanguageEditor({
  listId,
  currentLanguage,
}: {
  listId: string;
  currentLanguage: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState(currentLanguage ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLang(currentLanguage ?? "");
  }, [currentLanguage]);

  async function handleChange(newLang: string) {
    setLang(newLang);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/listes/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang || null }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Langue de la liste (filtre Bibliothèque) :
      </span>
      <div className="flex flex-wrap gap-1">
        {PREFERRED_LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            disabled={saving}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-sm transition disabled:opacity-50 ${
              (lang || "") === opt.value
                ? "border-primary bg-primary/10 dark:border-primary-light dark:bg-primary/20"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500"
            }`}
            title={opt.label}
          >
            <FlagDisplay langCode={opt.value} size={18} />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      {saving && <span className="text-xs text-slate-500">Enregistrement…</span>}
      {saved && (
        <span className="text-xs text-green-600 dark:text-green-400">
          Enregistré. La liste apparaîtra sous ce filtre dans la{" "}
          <Link href="/app/familles" className="underline hover:no-underline">
            Bibliothèque
          </Link>
          .
        </span>
      )}
    </div>
  );
}
