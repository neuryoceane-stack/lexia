"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DM_Sans } from "next/font/google";
import {
  PawPrint,
  FileText,
  Camera,
  Image,
  Upload,
  Link2,
  Music,
  Loader2,
} from "lucide-react";

const dmSans = DM_Sans({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

type MotsSauvagesSourceProps = {
  extractLoading: boolean;
  /** PDF vs image — pour afficher le message OCR scanné après un court délai */
  extractKind: "pdf" | "image" | null;
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

const PHASE_1_MS = 2000;
const PHASE_2_MS = 5000;

function extractionPhaseMessage(
  kind: "pdf" | "image",
  elapsedMs: number
): string {
  if (kind === "pdf") {
    if (elapsedMs < PHASE_1_MS) return "Lecture du PDF…";
    if (elapsedMs < PHASE_2_MS) return "Extraction du texte en cours…";
    return "PDF scanné détecté — analyse par IA en cours… (cela peut prendre 10-15 secondes)";
  }
  if (elapsedMs < PHASE_1_MS) return "Lecture de l’image…";
  if (elapsedMs < PHASE_2_MS) return "Extraction du texte en cours…";
  return "Analyse par intelligence artificielle en cours… (cela peut prendre 10-15 secondes)";
}

export function MotsSauvagesSource({
  extractLoading,
  extractKind,
  extractError,
  onFileSelect,
  fileInputRef,
  cameraInputRef,
  imageInputRef,
}: MotsSauvagesSourceProps) {
  const router = useRouter();
  const [extractElapsedMs, setExtractElapsedMs] = useState(0);

  useEffect(() => {
    if (!extractLoading) {
      setExtractElapsedMs(0);
      return;
    }
    const t0 = Date.now();
    const tick = () => setExtractElapsedMs(Date.now() - t0);
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [extractLoading]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-5 text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
      >
        ← Retour
      </button>

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-[10px]">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              background: "var(--background-subtle)",
              borderRadius: 8,
            }}
          >
            <PawPrint size={18} stroke="#6C3FC8" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>
            Mots sauvages
          </h1>
        </div>
        <p className="mt-2" style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
          Capture des mots depuis ton environnement réel — musique, articles,
          photos, PDF.
        </p>
      </header>

      {extractLoading && (
        <div
          className={`${dmSans.className} mb-6 rounded-[12px] border-2 bg-white p-4 shadow-sm`}
          style={{ borderColor: "#6C3FC8" }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="relative mb-4 h-2 overflow-hidden rounded-full"
            style={{ background: "#EDE8FA" }}
          >
            <div className="lexiva-extract-shimmer-bar" aria-hidden />
          </div>
          <div className="flex items-start gap-3">
            <Loader2
              className="mt-0.5 shrink-0 animate-spin text-[#6C3FC8]"
              size={22}
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-snug text-[var(--foreground)]">
                {extractionPhaseMessage(
                  extractKind === "pdf" ? "pdf" : "image",
                  extractElapsedMs
                )}
              </p>
              <p className="mt-2 text-[13px] font-normal leading-relaxed text-[var(--foreground-muted)]">
                {extractKind === "pdf"
                  ? "Les PDF numériques sont en général rapides ; les scans passent par l’IA."
                  : "Première analyse : le moteur OCR peut prendre un peu plus de temps."}
              </p>
            </div>
          </div>
        </div>
      )}

      {extractError && !extractLoading ? (
        <p
          className={`${dmSans.className} mb-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700`}
        >
          {extractError}
        </p>
      ) : null}

      {/* Section label */}
      <p
        className="mb-3"
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--foreground-muted)",
        }}
      >
        Choisir un mode
      </p>

      {/* 3 cartes actives */}
      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        {/* PDF */}
        <ActiveCard
          bg="var(--background-subtle)"
          border="#DDD6F5"
          hoverBorder="#6C3FC8"
          iconBg="#DDD6F5"
          icon={<FileText size={18} stroke="#6C3FC8" />}
          title="PDF"
          description="Importe un livre, un cours ou un article en PDF."
          btnBg="#6C3FC8"
          btnLabel="Choisir"
          btnIcon={<Upload size={13} stroke="white" />}
          onClick={() => fileInputRef.current?.click()}
          disabled={extractLoading}
        />

        {/* Photo */}
        <ActiveCard
          bg="var(--background-card)"
          border="#F5D08A"
          hoverBorder="#F5A623"
          iconBg="#FAE5B0"
          icon={<Camera size={18} stroke="#C47D0A" />}
          title="Photo"
          description="Prends en photo une affiche, un menu, un livre."
          btnBg="#F5A623"
          btnLabel="Ouvrir"
          btnIcon={<Camera size={13} stroke="white" />}
          onClick={() => cameraInputRef.current?.click()}
          disabled={extractLoading}
        />

        {/* Galerie */}
        <ActiveCard
          bg="var(--background-card)"
          border="#C3E6D6"
          hoverBorder="#1D9E75"
          iconBg="#C3E6D6"
          icon={<Image size={18} stroke="#1D9E75" />}
          title="Galerie"
          description="Importe une image depuis ta bibliothèque photo."
          btnBg="#1D9E75"
          btnLabel="Importer"
          btnIcon={<Upload size={13} stroke="white" />}
          onClick={() => imageInputRef.current?.click()}
          disabled={extractLoading}
        />
      </div>

      {/* Hidden inputs */}
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
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Section "Bientôt disponible" */}
      <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] p-4">
        <p
          className="mb-3"
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--foreground-muted)",
          }}
        >
          Bientôt disponible
        </p>

        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
        <ComingSoonCard
          icon={<Link2 size={18} className="text-[var(--foreground-disabled)]" stroke="currentColor" />}
          title="Lien URL"
          description="Colle le lien d'un article de presse ou d'une page web."
        />
        <ComingSoonCard
          icon={<Music size={18} className="text-[var(--foreground-disabled)]" stroke="currentColor" />}
          title="Chanson"
          description="Apprends depuis les paroles de tes musiques préférées."
        />
        </div>
      </section>

      {/* Tip */}
      <div
        className="mt-8 flex items-start gap-3"
        style={{
          background: "var(--background-subtle)",
          border: "0.5px solid var(--border)",
          borderRadius: 10,
          padding: "11px 14px",
        }}
      >
        <PawPrint size={15} stroke="#F5A623" className="mt-0.5 shrink-0" />
        <p style={{ fontSize: 12, color: "var(--foreground-muted)", lineHeight: 1.5 }}>
          Touche n&apos;importe quel mot que tu ne connais pas — la traduction
          apparaît instantanément et tu peux l&apos;ajouter à ta liste en un
          tap.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ActiveCard({
  bg,
  border,
  hoverBorder,
  iconBg,
  icon,
  title,
  description,
  btnBg,
  btnLabel,
  btnIcon,
  onClick,
  disabled,
}: {
  bg: string;
  border: string;
  hoverBorder: string;
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  btnBg: string;
  btnLabel: string;
  btnIcon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="card-hover group relative flex flex-col overflow-hidden transition-all duration-150 hover:-translate-y-[2px]"
      style={{
        background: bg,
        border: `0.5px solid ${border}`,
        borderRadius: 16,
        padding: "16px 14px",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = hoverBorder)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = border)
      }
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: iconBg,
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", marginBottom: 4 }}>
        {title}
      </p>
      <p style={{ fontSize: 11, color: "var(--foreground-muted)", flex: 1, marginBottom: 12 }}>
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="self-start transition hover:brightness-95 disabled:opacity-50"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: btnBg,
          color: "white",
          borderRadius: 20,
          border: "none",
          padding: "7px 14px",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {btnIcon}
        {btnLabel}
      </button>
    </div>
  );
}

function ComingSoonCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="relative flex flex-col"
      style={{
        background: "var(--background)",
        border: "0.5px dashed var(--border)",
        borderRadius: 16,
        padding: "16px 14px",
        opacity: 0.75,
        cursor: "default",
      }}
    >
      <span
        className="absolute"
        style={{
          top: 12,
          right: 12,
          background: "var(--background-subtle)",
          color: "#6C3FC8",
          fontSize: 10,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 8,
        }}
      >
        Bientôt
      </span>
      <div
        className="flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--background-subtle)",
          marginBottom: 10,
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground-disabled)", marginBottom: 4 }}>
        {title}
      </p>
      <p style={{ fontSize: 11, color: "var(--foreground-disabled)", flex: 1, marginBottom: 12 }}>
        {description}
      </p>
      <p style={{ fontSize: 12, color: "var(--foreground-disabled)", fontStyle: "italic" }}>
        Prochainement
      </p>
    </div>
  );
}
