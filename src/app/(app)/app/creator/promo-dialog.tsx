"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  PROMO_BENEFIT_TYPES,
  generatePromoCode,
  parsePromoDraft,
  promoBenefitName,
  promoValueField,
  type PromoBenefitType,
} from "@/lib/promo-codes";
import { ErrorNote, fieldClass, outlineButtonClass, primaryButtonClass } from "./creator-ui";

export function PromoDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (couponReady: boolean) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [benefitType, setBenefitType] = useState<PromoBenefitType>("percent");
  const [value, setValue] = useState("");
  const [institution, setInstitution] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [appliesMonthly, setAppliesMonthly] = useState(true);
  const [appliesAnnual, setAppliesAnnual] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  savingRef.current = saving;

  useEffect(() => {
    if (!open) return;
    setCode("");
    setBenefitType("percent");
    setValue("");
    setInstitution("");
    setMaxUses("");
    setEndsOn("");
    setAppliesMonthly(true);
    setAppliesAnnual(true);
    setError(null);
    setSaving(false);
    const frame = window.requestAnimationFrame(() => codeRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const nodes = [...dialog.querySelectorAll<HTMLElement>("button, input, textarea, [href]")].filter(
        (node) => !node.hasAttribute("disabled"),
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const valueField = promoValueField(benefitType);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePromoDraft(
      {
        code,
        benefitType,
        value,
        institution,
        maxUses,
        endsOn: endsOn || null,
        appliesMonthly,
        appliesAnnual,
      },
      new Date(),
    );
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/creator/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: parsed.draft.code,
          benefitType: parsed.draft.benefitType,
          value,
          institution,
          maxUses,
          endsOn: endsOn || null,
          appliesMonthly,
          appliesAnnual,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readError(body, "Le code n'a pas pu être créé."));
        setSaving(false);
        return;
      }
      const couponReady =
        body != null &&
        typeof body === "object" &&
        "couponReady" in body &&
        (body as { couponReady?: unknown }).couponReady === true;
      onCreated(couponReady);
    } catch {
      setError("Le code n'a pas pu être créé.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color-mix(in_srgb,var(--ink)_40%,transparent)]"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div className="flex min-h-[100dvh] items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="my-auto w-full max-w-lg rounded-[20px] border border-line bg-surface p-5 shadow-[var(--shadow-elevated)] sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <h2 id={titleId} className="m-0 text-[26px] leading-tight text-ink">
              Nouveau code promo
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Fermer"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-40"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <div>
              <label htmlFor="promo-code" className="mb-1.5 block text-sm font-medium text-ink">
                Code
              </label>
              <div className="flex gap-2">
                <input
                  ref={codeRef}
                  id="promo-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={32}
                  placeholder="LYCEE-2026"
                  className={`${fieldClass} uppercase tracking-wide`}
                />
                <button
                  type="button"
                  onClick={() => setCode(generatePromoCode())}
                  className={outlineButtonClass}
                >
                  Générer
                </button>
              </div>
              <p className="m-0 mt-1.5 text-xs text-muted">
                Lettres, chiffres et tirets. Le code est enregistré en majuscules.
              </p>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">Avantage</legend>
              <div className="grid grid-cols-2 gap-2">
                {PROMO_BENEFIT_TYPES.map((type) => {
                  const selected = benefitType === type;
                  return (
                    <label
                      key={type}
                      className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-3 text-sm text-ink outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
                        selected ? "border-[1.5px] border-ink bg-mark" : "border-line bg-surface"
                      }`}
                    >
                      <input
                        type="radio"
                        name="promo-benefit"
                        value={type}
                        checked={selected}
                        onChange={() => setBenefitType(type)}
                        className="sr-only"
                      />
                      {promoBenefitName(type)}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="promo-value" className="mb-1.5 block text-sm font-medium text-ink">
                {valueField.label}
              </label>
              <div className="relative">
                <input
                  id="promo-value"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  inputMode={benefitType === "fixed_amount" ? "decimal" : "numeric"}
                  className={`${fieldClass} pr-16`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">
                  {valueField.unit}
                </span>
              </div>
              <p className="m-0 mt-1.5 text-xs leading-relaxed text-muted">{valueField.hint}</p>
            </div>

            <div>
              <label htmlFor="promo-institution" className="mb-1.5 block text-sm font-medium text-ink">
                Établissement <span className="font-normal text-muted">(facultatif)</span>
              </label>
              <input
                id="promo-institution"
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
                maxLength={120}
                className={fieldClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="promo-max" className="mb-1.5 block text-sm font-medium text-ink">
                  Limite d&apos;utilisations
                </label>
                <input
                  id="promo-max"
                  value={maxUses}
                  onChange={(event) => setMaxUses(event.target.value)}
                  inputMode="numeric"
                  placeholder="Illimité"
                  className={fieldClass}
                />
                <p className="m-0 mt-1.5 text-xs text-muted">Laissez vide pour un nombre illimité.</p>
              </div>
              <div>
                <label htmlFor="promo-end" className="mb-1.5 block text-sm font-medium text-ink">
                  Date de fin
                </label>
                <input
                  id="promo-end"
                  type="date"
                  value={endsOn}
                  min={parisToday()}
                  onChange={(event) => setEndsOn(event.target.value)}
                  className={fieldClass}
                />
                <p className="m-0 mt-1.5 text-xs text-muted">
                  Facultatif. Le code reste valable jusqu&apos;à la fin de cette journée.
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">Formules concernées</legend>
              <div className="grid grid-cols-2 gap-2">
                <PlanCheck label="Mensuel" checked={appliesMonthly} onChange={setAppliesMonthly} />
                <PlanCheck label="Annuel" checked={appliesAnnual} onChange={setAppliesAnnual} />
              </div>
              <p className="m-0 mt-1.5 text-xs text-muted">Choisissez au moins une formule.</p>
            </fieldset>

            {error ? <ErrorNote>{error}</ErrorNote> : null}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={saving} className={outlineButtonClass}>
                Annuler
              </button>
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {saving ? "Création…" : "Créer le code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PlanCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
        checked ? "border-[1.5px] border-ink" : "border-line"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-ink"
      />
      {label}
    </label>
  );
}

function parisToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function readError(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return fallback;
}
