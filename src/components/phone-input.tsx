"use client";

import { useState, useEffect, useMemo, useRef } from "react";

/** Préfixes téléphoniques : liste avec code et pays. Affichage liste : "+33 (France)" ; une fois choisi : "+33" seul. */
const PREFIXES_LIST: { code: string; country: string }[] = [
  { code: "+33", country: "France" },
  { code: "+32", country: "Belgique" },
  { code: "+41", country: "Suisse" },
  { code: "+352", country: "Luxembourg" },
  { code: "+377", country: "Monaco" },
  { code: "+44", country: "Royaume-Uni" },
  { code: "+1", country: "États-Unis / Canada" },
  { code: "+49", country: "Allemagne" },
  { code: "+34", country: "Espagne" },
  { code: "+39", country: "Italie" },
  { code: "+351", country: "Portugal" },
  { code: "+31", country: "Pays-Bas" },
  { code: "+48", country: "Pologne" },
  { code: "+212", country: "Maroc" },
  { code: "+213", country: "Algérie" },
  { code: "+216", country: "Tunisie" },
  { code: "+221", country: "Sénégal" },
  { code: "+225", country: "Côte d'Ivoire" },
  { code: "+223", country: "Mali" },
  { code: "+229", country: "Bénin" },
  { code: "+228", country: "Togo" },
  { code: "+226", country: "Burkina Faso" },
  { code: "+227", country: "Niger" },
  { code: "+224", country: "Guinée" },
  { code: "+262", country: "La Réunion" },
  { code: "+594", country: "Guyane" },
  { code: "+596", country: "Martinique" },
  { code: "+590", country: "Guadeloupe" },
  { code: "+7", country: "Russie" },
  { code: "+86", country: "Chine" },
  { code: "+81", country: "Japon" },
  { code: "+82", country: "Corée du Sud" },
  { code: "+91", country: "Inde" },
  { code: "+55", country: "Brésil" },
  { code: "+52", country: "Mexique" },
  { code: "+61", country: "Australie" },
  { code: "+27", country: "Afrique du Sud" },
  { code: "+20", country: "Égypte" },
  { code: "+90", country: "Turquie" },
];

const DEFAULT_PREFIX = "+33";

const PREFIXES_BY_LENGTH = [...PREFIXES_LIST].sort(
  (a, b) => b.code.length - a.code.length
);

function parseStored(value: string): { prefix: string; local: string } {
  const trimmed = value.trim();
  if (!trimmed) return { prefix: DEFAULT_PREFIX, local: "" };
  if (trimmed.startsWith("+")) {
    for (const p of PREFIXES_BY_LENGTH) {
      const code = p.code.slice(1);
      if (trimmed.startsWith("+" + code)) {
        const local = trimmed.slice(1 + code.length).replace(/\D/g, "");
        return { prefix: p.code, local };
      }
    }
    return { prefix: DEFAULT_PREFIX, local: trimmed.slice(1).replace(/\D/g, "") };
  }
  return { prefix: DEFAULT_PREFIX, local: trimmed.replace(/\D/g, "") };
}

function buildFull(prefix: string, local: string): string {
  const digits = local.replace(/\D/g, "");
  if (!digits) return "";
  return prefix + digits;
}

type PhoneInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
};

export function PhoneInput({
  id = "phone",
  value,
  onChange,
  placeholder = "6 12 34 56 78",
  disabled,
  className,
  inputClassName,
  "aria-label": ariaLabel,
}: PhoneInputProps) {
  const parsed = useMemo(() => parseStored(value), [value]);
  const [prefix, setPrefix] = useState(parsed.prefix);
  const [local, setLocal] = useState(parsed.local);

  useEffect(() => {
    const p = parseStored(value);
    setPrefix(p.prefix);
    setLocal(p.local);
  }, [value]);

  const handlePrefixChange = (newPrefix: string) => {
    setPrefix(newPrefix);
    onChange(buildFull(newPrefix, local));
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setLocal(v);
    onChange(buildFull(prefix, v));
  };

  const [open, setOpen] = useState(false);
  const prefixRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (prefixRef.current && !prefixRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={`flex ${className ?? ""}`}>
      <div ref={prefixRef} className="relative flex-shrink-0">
        <button
          type="button"
          aria-label="Indicatif pays"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? "phone-prefix-listbox" : undefined}
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className="flex min-w-[5.5rem] items-center justify-between gap-1 rounded-l-lg border border-r-0 border-[var(--input-border)] bg-[var(--background-subtle)] px-2 py-2 text-[var(--foreground)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        >
          <span>{prefix}</span>
          <svg className="h-4 w-4 flex-shrink-0 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <ul
            id="phone-prefix-listbox"
            role="listbox"
            className="absolute left-0 top-full z-10 mt-1 max-h-64 w-72 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background-card)] py-1 shadow-lg"
          >
            {PREFIXES_LIST.map((p) => (
              <li
                key={p.code}
                role="option"
                aria-selected={p.code === prefix}
                onClick={() => {
                  handlePrefixChange(p.code);
                  setOpen(false);
                }}
                onMouseDown={(e) => e.preventDefault()}
                className={`cursor-pointer px-3 py-2 text-sm ${p.code === prefix ? "bg-primary/10 font-medium text-primary" : "text-[var(--foreground)] hover:bg-[var(--hover-bg)]"}`}
              >
                {p.code} ({p.country})
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        id={id}
        type="tel"
        value={local}
        onChange={handleLocalChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="tel-national"
        aria-label={ariaLabel}
        className={`flex-1 rounded-r-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${inputClassName ?? ""}`}
      />
    </div>
  );
}
