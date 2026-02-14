"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RevueImport } from "@/components/revue-import";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";

type Method = "manual" | "pdf" | "image" | null;

export default function NouvelleListePage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.id as string;
  const [method, setMethod] = useState<Method>(null);
  const [extractedItems, setExtractedItems] = useState<
    Array<{ term: string; definition: string }>
  >([]);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.preferredLanguage != null) setPreferredLanguage(data.preferredLanguage);
      })
      .catch(() => {});
  }, []);

  const handleFile = useCallback(
    async (file: File, endpoint: "/api/extract/pdf" | "/api/extract/ocr") => {
      setExtractError("");
      setExtractLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setExtractError(data.error ?? "Erreur lors de l’extraction");
          setExtractLoading(false);
          return;
        }
        setExtractedItems(data.items ?? []);
        setExtractLoading(false);
      } catch {
        setExtractError("Erreur réseau");
        setExtractLoading(false);
      }
    },
    []
  );

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMethod("pdf");
    const file = e.target.files?.[0];
    if (file) handleFile(file, "/api/extract/pdf");
    e.target.value = "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMethod("image");
    const file = e.target.files?.[0];
    if (file) handleFile(file, "/api/extract/ocr");
    e.target.value = "";
  };

  const onSaved = () => router.push(`/app/familles/${familyId}`);

  if (extractedItems.length > 0) {
    return (
      <div>
        <div className="mb-4">
          <Link
            href={`/app/familles/${familyId}`}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
          >
            ← Retour
          </Link>
        </div>
        <RevueImport
          familyId={familyId}
          initialItems={extractedItems}
          source={method === "pdf" ? "pdf" : "ocr"}
          defaultLanguage={preferredLanguage}
          onSaved={onSaved}
          onCancel={() => setExtractedItems([])}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/app/familles/${familyId}`}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← Retour
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Nouvelle liste de mots
      </h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        Choisis comment ajouter tes mots : à la main, depuis un PDF ou une image (reconnaissance de texte).
      </p>

      {method === null && (
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setMethod("manual")}
            className="btn-relief flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <span className="text-3xl" aria-hidden>✏️</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              Manuel
            </span>
            <span className="text-center text-sm text-slate-500 dark:text-slate-400">
              Saisir les mots un par un ou en bloc
            </span>
          </button>
          <label className="btn-relief flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-light">
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handlePdfChange}
              disabled={extractLoading}
            />
            <span className="text-3xl" aria-hidden>📄</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              PDF
            </span>
            <span className="text-center text-sm text-slate-500 dark:text-slate-400">
              Extraire le texte d’un document PDF
            </span>
          </label>
          <label className="btn-relief flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-light">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={extractLoading}
            />
            <span className="text-3xl" aria-hidden>🖼️</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              Image
            </span>
            <span className="text-center text-sm text-slate-500 dark:text-slate-400">
              Reconnaissance de texte (OCR) sur une photo
            </span>
          </label>
        </div>
      )}

      {method !== null && method === "manual" && (
        <FormManuel
          familyId={familyId}
          defaultLanguage={preferredLanguage}
          onBack={() => setMethod(null)}
        />
      )}

      {extractLoading && (
        <p className="mt-6 text-slate-600 dark:text-slate-400">
          Extraction en cours…
        </p>
      )}
      {extractError && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {extractError}
        </p>
      )}
    </div>
  );
}

function FormManuel({
  familyId,
  defaultLanguage,
  onBack,
}: {
  familyId: string;
  defaultLanguage: string | null;
  onBack: () => void;
}) {
  const router = useRouter();
  const [listName, setListName] = useState("");
  const [listLanguage, setListLanguage] = useState(() => defaultLanguage ?? "");
  useEffect(() => {
    if (defaultLanguage != null && listLanguage === "" && defaultLanguage !== "") {
      setListLanguage(defaultLanguage);
    }
  }, [defaultLanguage, listLanguage]);
  const [rows, setRows] = useState<Array<{ term: string; definition: string }>>([
    { term: "", definition: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addRow() {
    setRows((r) => [...r, { term: "", definition: "" }]);
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRow(
    i: number,
    field: "term" | "definition",
    value: string
  ) {
    setRows((r) => {
      const next = [...r];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = listName.trim();
    if (!name) {
      setError("Donne un nom à la liste.");
      return;
    }
    const words = rows
      .map((r) => ({ term: r.term.trim(), definition: r.definition.trim() }))
      .filter((w) => w.term.length > 0);
    if (words.length === 0) {
      setError("Ajoute au moins un mot.");
      return;
    }
    setLoading(true);
    try {
      const listRes = await fetch(`/api/familles/${familyId}/listes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          source: "manual",
          language: listLanguage.trim() || undefined,
        }),
      });
      const listData = await listRes.json().catch(() => ({}));
      if (!listRes.ok) {
        setError(listData.error ?? "Erreur création liste");
        setLoading(false);
        return;
      }
      const listId = listData.id;
      const wordsRes = await fetch(`/api/listes/${listId}/mots/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      if (!wordsRes.ok) {
        setError("Liste créée mais erreur lors de l’ajout des mots.");
        setLoading(false);
        return;
      }
      router.push(`/app/familles/${familyId}/listes/${listId}`);
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="btn-relief rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:text-slate-200"
      >
        ← Changer de méthode
      </button>
      <div>
        <label
          htmlFor="list-name-manual"
          className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          Nom de la liste
        </label>
        <input
          id="list-name-manual"
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          required
          placeholder="ex. Parties du corps"
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>
      <div>
        <label
          htmlFor="list-lang-manual"
          className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          Langue de la liste
        </label>
        <select
          id="list-lang-manual"
          value={listLanguage}
          onChange={(e) => setListLanguage(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          aria-label="Langue de la liste"
        >
          <option value="">Aucune</option>
          {PREFERRED_LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Mots
          </label>
          <button
            type="button"
            onClick={addRow}
            className="btn-relief rounded px-2 py-1 text-sm text-primary hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary/20"
          >
            + Ajouter une ligne
          </button>
        </div>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={row.term}
                onChange={(e) => updateRow(i, "term", e.target.value)}
                placeholder="Mot / terme"
                className="flex-1 min-w-[120px] rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <input
                type="text"
                value={row.definition}
                onChange={(e) => updateRow(i, "definition", e.target.value)}
                placeholder="Traduction / définition"
                className="flex-1 min-w-[120px] rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="btn-relief rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700 dark:hover:text-red-400"
                aria-label="Supprimer la ligne"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Enregistrer la liste"}
        </button>
      </div>
    </form>
  );
}
