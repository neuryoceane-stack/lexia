"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { classInvitePath, normalizeClassCode } from "@/lib/class-code";

type CopyKey = "lien" | "code" | "message";

type Props = {
  identifier: string;
  title: string;
};

export function ClassAccessCodeBanner({ identifier, title }: Props) {
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const display = normalizeClassCode(identifier) ?? identifier.trim().toUpperCase();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function copy(key: CopyKey, value: string) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("clipboard-timeout")), 1500);
        }),
      ]);
      setCopyError(null);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
    } catch (error) {
      setCopied(null);
      setCopyError("La copie a échoué. Sélectionnez le texte ci-dessus.");
      console.error("[class-access-code] copie impossible", error);
    }
  }

  function inviteUrl(): string {
    const path = classInvitePath(display);
    return origin ? `${origin}${path}` : path;
  }

  function invitationText(): string {
    return [
      "Bonjour,",
      "",
      `Rejoignez la classe « ${title} » sur ${BRAND_NAME}.`,
      `Lien : ${inviteUrl()}`,
      `Code : ${display}`,
    ].join("\n");
  }

  return (
    <section
      className="mb-4 rounded-[14px] border border-line bg-surface px-4 py-4"
      aria-label="Invitation des élèves"
    >
      <p className="m-0 text-xs font-medium text-muted">Invitation des élèves</p>
      <p className="m-0 mt-1 font-mono text-[22px] font-medium tracking-[0.12em] text-ink">
        {display}
      </p>
      <p className="m-0 mt-1 text-sm leading-relaxed text-muted">
        Vos élèves ouvrent le lien, créent un compte s&apos;ils n&apos;en ont pas, puis vous les acceptez.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => copy("lien", inviteUrl())}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-surface"
        >
          {copied === "lien" ? <Check size={16} strokeWidth={2} aria-hidden /> : <Link2 size={16} strokeWidth={2} aria-hidden />}
          {copied === "lien" ? "Lien copié" : "Copier le lien"}
        </button>
        <button
          type="button"
          onClick={() => copy("code", display)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink"
        >
          {copied === "code" ? <Check size={16} strokeWidth={2} aria-hidden /> : <Copy size={16} strokeWidth={2} aria-hidden />}
          {copied === "code" ? "Code copié" : "Copier le code"}
        </button>
        <button
          type="button"
          onClick={() => copy("message", invitationText())}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink"
        >
          {copied === "message" ? <Check size={16} strokeWidth={2} aria-hidden /> : <Copy size={16} strokeWidth={2} aria-hidden />}
          {copied === "message" ? "Message copié" : "Copier le message"}
        </button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-[12px] border border-line bg-page px-3 py-3 font-sans text-sm leading-relaxed text-ink">
        {invitationText()}
      </pre>
      {copyError ? (
        <p className="m-0 mt-3 text-sm text-false-text" role="alert">
          {copyError}
        </p>
      ) : null}
    </section>
  );
}
