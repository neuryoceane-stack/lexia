"use client";

import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";

const PRIMARY = "#6C3FC8";

function formatDisplay(identifier: string): string {
  const up = identifier.trim().toUpperCase();
  const core = up.startsWith("LX-") ? up.slice(3) : up;
  return `LX-${core}`;
}

/** Code saisi par les élèves (identifiant en base). */
function clipboardCode(identifier: string): string {
  const up = identifier.trim().toUpperCase();
  return up.startsWith("LX-") ? up.slice(3) : up;
}

type Props = {
  identifier: string;
};

export function ClassAccessCodeBanner({ identifier }: Props) {
  const [copied, setCopied] = useState(false);
  const codeDisplay = formatDisplay(identifier);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(clipboardCode(identifier));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="flex items-center gap-3.5"
      style={{
        background: "#F0EDF8",
        border: "0.5px solid #DDD6F5",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 36,
          height: 36,
          background: PRIMARY,
          borderRadius: 9,
        }}
      >
        <Lock size={18} stroke="white" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p
          style={{
            fontSize: 11,
            color: PRIMARY,
            fontWeight: 500,
            margin: "0 0 2px",
          }}
        >
          Code d&apos;accès élèves
        </p>
        <p
          className="font-mono"
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: PRIMARY,
            letterSpacing: 2,
            margin: 0,
            wordBreak: "break-all",
          }}
        >
          {codeDisplay}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--foreground-muted)",
            margin: "2px 0 0",
          }}
        >
          À partager avec tes élèves pour rejoindre la classe
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 cursor-pointer items-center gap-1 border-0"
        style={{
          background: PRIMARY,
          color: "white",
          borderRadius: 12,
          padding: "6px 12px",
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {copied ? (
          <>
            <Check size={11} stroke="white" strokeWidth={2} aria-hidden />
            Copié ✓
          </>
        ) : (
          <>
            <Copy size={11} stroke="white" strokeWidth={2} aria-hidden />
            Copier
          </>
        )}
      </button>
    </div>
  );
}
