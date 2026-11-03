"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, X } from "lucide-react";
import { ANNOUNCEMENT_TYPE_LABELS, type AnnouncementType, type StudentBanner } from "@/lib/announcements";

export function AnnouncementBanner({
  announcement,
  preview = false,
}: {
  announcement: StudentBanner;
  preview?: boolean;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hidden) return null;

  const important = announcement.type === "important";
  const role = preview ? "region" : important ? "alert" : "status";

  async function dismiss() {
    if (preview || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/announcements/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: announcement.id }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "L'annonce n'a pas pu être fermée.";
        setError(message);
        setPending(false);
        return;
      }
      setHidden(true);
      router.refresh();
    } catch {
      setError("L'annonce n'a pas pu être fermée.");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div
        role={role}
        aria-label={preview ? "Aperçu de l'annonce" : undefined}
        aria-busy={pending || undefined}
        className={`flex items-start gap-2 rounded-[14px] px-4 py-3 ${shellClass(announcement.type)}`}
      >
        <div className="min-w-0 flex-1 py-1">
          <p className="m-0">
            <span className={badgeClass(announcement.type)}>{ANNOUNCEMENT_TYPE_LABELS[announcement.type]}</span>
          </p>
          <p className="m-0 mt-1.5 text-[15px] leading-snug text-ink">
            <span className={announcement.type === "news" ? "marker" : undefined}>{announcement.message}</span>
          </p>
          {announcement.linkLabel && announcement.linkUrl ? (
            <AnnouncementLink href={announcement.linkUrl} label={announcement.linkLabel} />
          ) : null}
        </div>
        {announcement.dismissible ? (
          <button
            type="button"
            onClick={() => void dismiss()}
            disabled={preview || pending}
            aria-label="Fermer l'annonce"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink outline-none hover:bg-[var(--hover-bg)] focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-70"
          >
            <X size={18} aria-hidden />
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="m-0 text-sm font-medium text-false-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AnnouncementLink({ href, label }: { href: string; label: string }) {
  const className =
    "mt-2 inline-flex min-h-11 items-center gap-1.5 font-medium text-ink underline decoration-1 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <ExternalLink size={15} aria-hidden />
      <span className="sr-only"> (nouvel onglet)</span>
    </a>
  );
}

function shellClass(type: AnnouncementType): string {
  if (type === "important") {
    return "border-[1.5px] border-ink bg-[color-mix(in_srgb,var(--ink)_8%,var(--surface))]";
  }
  return "border border-line bg-surface";
}

function badgeClass(type: AnnouncementType): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (type === "important") return `${base} bg-ink text-surface`;
  if (type === "news") return `${base} bg-mark text-ink`;
  return `${base} border border-line bg-surface text-ink`;
}
