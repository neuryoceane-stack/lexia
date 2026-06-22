"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { RevueImport } from "@/components/revue-import";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import {
  Pencil,
  FileText,
  Image as ImageIcon,
  Upload,
  Camera,
  Plus,
  ArrowRight,
} from "lucide-react";

/** Redimensionne l'image (côté client) pour accélérer envoi et traitement. */
function resizeImage(file: File, maxSize: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxSize && height <= maxSize) {
        resolve(file);
        return;
      }
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type,
        0.9
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

type Method = "manual" | "pdf" | "image" | null;

export default function NouvelleListePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId = params.id as string;
  /** Langue passée depuis la modale Bibliothèque (?lang=xxx) ou préférence utilisateur. */
  const langFromUrl = searchParams.get("lang")?.trim() || null;
  /** Nom de la liste passé depuis la modale (?name=xxx), prérempli en bas sur « Réviser les mots extraits ». */
  const listNameFromUrl = searchParams.get("name")?.trim() || null;
  const [method, setMethod] = useState<Method>(null);
  const [extractedItems, setExtractedItems] = useState<
    Array<{ term: string; definition: string }>
  >([]);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractPhase, setExtractPhase] = useState<"vision" | "ocr" | null>(null);
  const [extractError, setExtractError] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);
  const defaultListLanguage = langFromUrl || preferredLanguage;

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.preferredLanguage != null) setPreferredLanguage(data.preferredLanguage);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleFile = useCallback(
    async (file: File, endpoint: "/api/extract/pdf" | "/api/extract/ocr") => {
      const lang = defaultListLanguage;
      setExtractError("");
      setExtractLoading(true);
      setExtractPhase(endpoint === "/api/extract/ocr" ? "ocr" : null);
      try {
        let fileToSend = file;
        if (endpoint === "/api/extract/ocr" && file.type.startsWith("image/")) {
          fileToSend = await resizeImage(file, 640);
        }
        const formData = new FormData();
        formData.append("file", fileToSend);
        if (endpoint === "/api/extract/ocr" && lang) {
          formData.append("ocrLang", lang);
        }
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setExtractError(data.error ?? "Erreur lors de l’extraction");
          setExtractLoading(false);
          setExtractPhase(null);
          return;
        }
        setExtractedItems(data.items ?? []);
        setExtractLoading(false);
        setExtractPhase(null);
      } catch {
        setExtractError("Erreur réseau");
        setExtractLoading(false);
        setExtractPhase(null);
      }
    },
    [defaultListLanguage]
  );

  /** Image : essaie d’abord l’extraction par IA (rapide), puis OCR en secours si pas de clé ou erreur. */
  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setMethod("image");
      setExtractError("");
      setExtractLoading(true);
      setExtractPhase("ocr");
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });

      (async () => {
        let fileToSend: File = file;
        if (file.type.startsWith("image/")) {
          fileToSend = await resizeImage(file, 640);
        }
        try {
          setOcrProgress("Extraction par IA en cours…");
          const formData = new FormData();
          formData.append("file", fileToSend);
          if (defaultListLanguage) formData.append("ocrLang", defaultListLanguage);
          const res = await fetch("/api/extract/ocr", { method: "POST", body: formData });
          const ocrData = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(ocrData.error ?? "Erreur lors de l'extraction");
          setExtractLoading(false);
          setExtractPhase(null);
          setOcrProgress("");
          setImagePreviewUrl((u) => {
            if (u) URL.revokeObjectURL(u);
            return null;
          });
          const items = ocrData.items ?? [];
          if (items.length > 0) {
            setExtractedItems(items);
          } else {
            setExtractError(
              "Aucune paire mot/traduction trouvée. Utilisez une photo avec une liste claire (ex. une ligne par paire : mot - traduction ou mot : traduction)."
            );
          }
        } catch (err) {
          setExtractLoading(false);
          setExtractPhase(null);
          setOcrProgress("");
          setImagePreviewUrl((u) => {
            if (u) URL.revokeObjectURL(u);
            return null;
          });
          const msg = err instanceof Error
            ? (err.name === "AbortError" ? "Délai dépassé. Réessayez avec une photo plus petite." : err.message)
            : "Erreur réseau ou extraction.";
          setExtractError(msg);
        }
      })();
    },
    [defaultListLanguage]
  );

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMethod("pdf");
    const file = e.target.files?.[0];
    if (file) handleFile(file, "/api/extract/pdf");
    e.target.value = "";
  };


  const onSaved = () => {
    // Redirection sans filtre langue pour que la liste importée reste visible
    // (la langue enregistrée peut différer du filtre choisi en amont)
    router.push("/app/familles");
  };

  if (extractedItems.length > 0) {
    return (
      <div>
        <BackLink href={`/app/familles/${familyId}`} />
        <RevueImport
          familyId={familyId}
          initialItems={extractedItems}
          source={method === "pdf" ? "pdf" : "ocr"}
          defaultLanguage={defaultListLanguage}
          defaultListName={listNameFromUrl}
          onSaved={onSaved}
          onCancel={() => setExtractedItems([])}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <button
        type="button"
        onClick={() => router.push(`/app/familles/${familyId}`)}
        className="mb-4 flex items-center gap-1 text-[var(--foreground-muted)] transition hover:opacity-70"
        style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
      >
        <ArrowRight size={13} stroke="currentColor" className="rotate-180" />
        Retour
      </button>
      <h1 className="mb-1" style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>
        Comment veux-tu ajouter tes mots ?
      </h1>
      <p className="mb-6" style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
        Choisis un mode pour créer ta liste.
      </p>

      {/* Hidden file inputs */}
      <input type="file" accept=".pdf,application/pdf" className="hidden" id="pdf-input-nl" onChange={handlePdfChange} disabled={extractLoading} />
      <input type="file" accept="image/*" className="hidden" id="image-input-nl" onChange={handleImageChange} disabled={extractLoading} />

      {method === null && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Carte Manuel */}
          <MethodCard
            bg="var(--background-subtle)"
            border="#C4B5F4"
            hoverBorder="#6C3FC8"
            iconBg="#6C3FC8"
            icon={<Pencil size={22} stroke="white" />}
            decoColor="#6C3FC8"
            title="Manuel"
            description="Saisis tes mots un par un ou colle une liste."
            btnBg="#6C3FC8"
            btnIcon={<Plus size={11} stroke="white" />}
            btnLabel="Commencer"
            arrowBg="#DDD6F5"
            arrowColor="#6C3FC8"
            onClick={() => setMethod("manual")}
          />

          {/* Carte PDF */}
          <MethodCard
            bg="var(--background-card)"
            border="var(--border)"
            hoverBorder="#F5A623"
            iconBg="#F5A623"
            icon={<FileText size={22} stroke="white" />}
            decoColor="#F5A623"
            title="PDF"
            description="Importe un document — l'IA extrait les mots automatiquement."
            btnBg="#F5A623"
            btnIcon={<Upload size={11} stroke="white" />}
            btnLabel="Importer"
            arrowBg="#FAE5B0"
            arrowColor="#F5A623"
            onClick={() => document.getElementById("pdf-input-nl")?.click()}
          />

          {/* Carte Photo ou image */}
          <MethodCard
            bg="var(--background-card)"
            border="var(--border)"
            hoverBorder="#1D9E75"
            iconBg="#1D9E75"
            icon={<ImageIcon size={22} stroke="white" />}
            decoColor="#1D9E75"
            title="Photo ou image"
            description="Prends une photo ou importe une image — l'IA lit le texte pour toi."
            btnBg="#1D9E75"
            btnIcon={<Camera size={11} stroke="white" />}
            btnLabel="Choisir"
            arrowBg="#C3E6D6"
            arrowColor="#1D9E75"
            onClick={() => document.getElementById("image-input-nl")?.click()}
          />
        </div>
      )}

      {method !== null && method === "manual" && (
        <FormManuel
          familyId={familyId}
          defaultLanguage={defaultListLanguage}
          onBack={() => setMethod(null)}
        />
      )}

      {extractLoading && (
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] p-6">
          <div className="flex items-start gap-4">
            {method === "image" && imagePreviewUrl && (
              <div className="flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                <img
                  src={imagePreviewUrl}
                  alt=""
                  className="h-24 w-auto max-w-[160px] object-contain"
                />
              </div>
            )}
            <span
              className="inline-block h-8 w-8 flex-shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)]">
                {method === "image"
                  ? extractPhase === "vision"
                    ? "Extraction par IA en cours…"
                    : "Reconnaissance du texte (OCR) en cours…"
                  : "Extraction en cours…"}
              </p>
              {method === "image" && extractPhase === "ocr" && (
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  {ocrProgress || "Reconnaissance du texte dans le navigateur…"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {extractError && (
        <p className="mt-4 text-sm text-red-600">
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
      const qs = listLanguage.trim()
        ? `?lang=${encodeURIComponent(listLanguage.trim())}`
        : "";
      router.push(`/app/familles${qs}`);
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
        className="btn-relief rounded px-2 py-1 text-sm text-[var(--foreground-muted)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)]"
      >
        ← Changer de méthode
      </button>
      <div>
        <label
          htmlFor="list-name-manual"
          className="mb-1 block text-sm font-medium text-[var(--foreground-muted)]"
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
          className="w-full max-w-md rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
        />
      </div>
      <div>
        <label
          htmlFor="list-lang-manual"
          className="mb-1 block text-sm font-medium text-[var(--foreground-muted)]"
        >
          Langue de la liste
        </label>
        <select
          id="list-lang-manual"
          value={listLanguage}
          onChange={(e) => setListLanguage(e.target.value)}
          className="w-full max-w-md rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
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
          <label className="text-sm font-medium text-[var(--foreground-muted)]">
            Mots
          </label>
          <button
            type="button"
            onClick={addRow}
            className="btn-relief rounded px-2 py-1 text-sm text-primary hover:bg-primary/10"
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
                className="flex-1 min-w-[120px] rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
              />
              <input
                type="text"
                value={row.definition}
                onChange={(e) => updateRow(i, "definition", e.target.value)}
                placeholder="Traduction / définition"
                className="flex-1 min-w-[120px] rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)]"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="btn-relief rounded p-2 text-[var(--foreground-disabled)] hover:bg-[var(--background-subtle)] hover:text-red-600"
                aria-label="Supprimer la ligne"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
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

function MethodCard({
  bg,
  border,
  hoverBorder,
  iconBg,
  icon,
  decoColor,
  title,
  description,
  btnBg,
  btnIcon,
  btnLabel,
  arrowBg,
  arrowColor,
  onClick,
}: {
  bg: string;
  border: string;
  hoverBorder: string;
  iconBg: string;
  icon: React.ReactNode;
  decoColor: string;
  title: string;
  description: string;
  btnBg: string;
  btnIcon: React.ReactNode;
  btnLabel: string;
  arrowBg: string;
  arrowColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden text-left card-hover"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 16,
        padding: "20px 16px 16px",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = hoverBorder)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: 48, height: 48, borderRadius: "50%", background: iconBg, marginBottom: 14 }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", marginBottom: 5 }}>
        {title}
      </p>
      <p style={{ fontSize: 12, color: "var(--foreground-muted)", flex: 1, marginBottom: 18 }}>
        {description}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-[5px]"
          style={{
            background: btnBg,
            color: "white",
            borderRadius: 20,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {btnIcon}
          {btnLabel}
        </span>
        <span
          className="flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: "50%", background: arrowBg }}
        >
          <ArrowRight size={12} stroke={arrowColor} />
        </span>
      </div>
      {/* Cercle décoratif */}
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: -20,
          right: -20,
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: decoColor,
          opacity: 0.1,
        }}
      />
    </button>
  );
}
