"use client";

import { useRouter } from "next/navigation";

type MotsSauvagesSourceProps = {
  extractLoading: boolean;
  extractError: string;
  urlInput: string;
  setUrlInput: (v: string) => void;
  songInput: string;
  setSongInput: (v: string) => void;
  urlLoading: boolean;
  songLoading: boolean;
  onFileSelect: (file: File) => void;
  onUrlAnalyze: () => void;
  onSongSearch: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
};

export function MotsSauvagesSource({
  extractLoading,
  extractError,
  urlInput,
  setUrlInput,
  songInput,
  setSongInput,
  urlLoading,
  songLoading,
  onFileSelect,
  onUrlAnalyze,
  onSongSearch,
  fileInputRef,
  cameraInputRef,
  imageInputRef,
}: MotsSauvagesSourceProps) {
  const router = useRouter();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-white">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 text-sm font-medium text-slate-500 transition hover:text-slate-700"
      >
        ← Retour
      </button>

      {/* Header */}
      <header>
        <h1 className="bg-gradient-to-r from-[#6C3FC8] via-[#8B5CF6] to-[#F5A623] bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
          Mots Sauvages 🌿
        </h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          Découvre des mots depuis tes vraies lectures, musiques et vidéos
        </p>
      </header>

      {/* Cartes sources */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Carte 1 — PDF */}
        <div
          className="flex flex-col rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            backgroundColor: "#F3EEFF",
            border: "1px solid #6C3FC8",
          }}
        >
          <span className="text-[48px] leading-none" aria-hidden>
            📄
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">PDF</h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Importe un fichier PDF
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={extractLoading}
            className="mt-4 w-fit rounded-full bg-[#6C3FC8] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5b34b0] disabled:opacity-50"
          >
            Choisir un PDF
          </button>
        </div>

        {/* Carte 2 — Prendre une photo */}
        <div
          className="flex flex-col rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            backgroundColor: "#FFF8EC",
            border: "1px solid #F5A623",
          }}
        >
          <span className="text-[48px] leading-none" aria-hidden>
            📷
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Prendre une photo
          </h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Ouvre l&apos;appareil photo
          </p>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={extractLoading}
            className="mt-4 w-fit rounded-full bg-[#F5A623] px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-[#F97316] disabled:opacity-50"
          >
            Prendre une photo
          </button>
        </div>

        {/* Carte 3 — Importer une image */}
        <div
          className="flex flex-col rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            backgroundColor: "#EDFDF6",
            border: "1px solid #10B981",
          }}
        >
          <span className="text-[48px] leading-none" aria-hidden>
            🖼️
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Importer une image
          </h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Depuis ta galerie
          </p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={extractLoading}
            className="mt-4 w-fit rounded-full bg-[#10B981] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#059669] disabled:opacity-50"
          >
            Choisir une image
          </button>
        </div>

        {/* Carte 4 — Lien URL */}
        <div
          className="flex flex-col rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            backgroundColor: "#EFF6FF",
            border: "1px solid #3B82F6",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[48px] leading-none" aria-hidden>
              🔗
            </span>
            <span className="rounded-full bg-[#3B82F6]/10 px-2.5 py-0.5 text-xs font-medium text-[#1D4ED8]">
              Nouveau
            </span>
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Lien URL</h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Colle un lien d&apos;article
          </p>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onUrlAnalyze}
            disabled={extractLoading || urlLoading || !urlInput.trim()}
            className="mt-3 w-fit rounded-full bg-[#3B82F6] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#2563EB] disabled:opacity-50"
          >
            {urlLoading ? "Analyse…" : "Analyser"}
          </button>
        </div>

        {/* Carte 5 — Chanson */}
        <div
          className="flex flex-col rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 lg:col-span-1"
          style={{
            backgroundColor: "#FDF2F8",
            border: "1px solid #EC4899",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[48px] leading-none" aria-hidden>
              🎵
            </span>
            <span className="rounded-full bg-[#EC4899]/10 px-2.5 py-0.5 text-xs font-medium text-[#DB2777]">
              Nouveau
            </span>
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Rechercher une chanson
          </h2>
          <p className="mt-2 flex-1 text-sm text-slate-600">
            Apprends depuis tes musiques préférées
          </p>
          <input
            type="text"
            value={songInput}
            onChange={(e) => setSongInput(e.target.value)}
            placeholder="Artiste + titre..."
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onSongSearch}
            disabled={extractLoading || songLoading || !songInput.trim()}
            className="mt-3 w-fit rounded-full bg-[#EC4899] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#DB2777] disabled:opacity-50"
          >
            {songLoading ? "Recherche…" : "Rechercher"}
          </button>
        </div>
      </div>

      {extractLoading && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="font-medium text-slate-800">
            Reconnaissance du texte en cours…
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Compte 30 secondes à 1–2 minutes (surtout la première fois : chargement du moteur OCR).
          </p>
        </div>
      )}
      {extractError && (
        <p className="mt-4 text-sm text-red-600">{extractError}</p>
      )}
    </div>
  );
}
