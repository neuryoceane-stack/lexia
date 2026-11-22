"use client";

import {
  REVISION_SESSION_WORD_PRESETS,
  isRevisionSessionAllWords,
  presetRevisionSessionWordLimit,
  revisionSessionSliderValues,
  snapRevisionSessionWordLimit,
} from "@/lib/revision-session-word-limit";

type Props = {
  totalWords: number;
  value: number;
  onChange: (next: number) => void;
  className?: string;
};

export function RevisionSessionWordSlider({
  totalWords,
  value,
  onChange,
  className = "",
}: Props) {
  if (totalWords <= 0) return null;

  const sliderValues = revisionSessionSliderValues(totalWords);
  const min = sliderValues[0] ?? 5;
  const max = totalWords;
  const allSelected = isRevisionSessionAllWords(value, totalWords);

  const sliderIndex = (() => {
    const idx = sliderValues.indexOf(value);
    if (idx >= 0) return idx;
    const snapped = snapRevisionSessionWordLimit(value, totalWords);
    const snapIdx = sliderValues.indexOf(snapped);
    return snapIdx >= 0 ? snapIdx : sliderValues.length - 1;
  })();

  const fillPct =
    sliderValues.length > 1
      ? (sliderIndex / (sliderValues.length - 1)) * 100
      : 100;

  function setFromSliderIndex(index: number) {
    const next = sliderValues[Math.min(Math.max(index, 0), sliderValues.length - 1)];
    if (next != null) onChange(next);
  }

  return (
    <div
      className={`rounded-[14px] border border-line bg-surface ${className}`}
      style={{ padding: "12px 14px" }}
      aria-labelledby="revision-session-word-limit-label"
    >
      <style>{`
        .revision-session-word-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 44px;
          background: transparent;
          margin: 0;
          cursor: pointer;
        }
        .revision-session-word-range:focus {
          outline: none;
        }
        .revision-session-word-range:focus-visible {
          outline: 2px solid var(--ink);
          outline-offset: 2px;
          border-radius: 999px;
        }
        .revision-session-word-range::-webkit-slider-runnable-track {
          height: 8px;
          background: transparent;
        }
        .revision-session-word-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 26px;
          height: 26px;
          margin-top: -9px;
          border-radius: 50%;
          background: var(--surface);
          border: 2.5px solid var(--ink);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--ink) 25%, transparent);
        }
        .revision-session-word-range::-moz-range-track {
          height: 8px;
          background: transparent;
        }
        .revision-session-word-range::-moz-range-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--surface);
          border: 2.5px solid var(--ink);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--ink) 25%, transparent);
        }
      `}</style>

      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p
          id="revision-session-word-limit-label"
          className="m-0 text-xs text-ink"
          style={{ fontWeight: 500 }}
        >
          Mots dans cette session
        </p>
        <p className="m-0 text-xs tabular-nums text-muted" style={{ fontWeight: 500 }}>
          {allSelected ? (
            <>Tout · {totalWords}</>
          ) : (
            <>
              {value} sur {totalWords}
            </>
          )}
        </p>
      </div>

      <div className="relative mb-3 flex h-11 items-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{ background: "var(--background-subtle)" }}
        />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{
            width: `${fillPct}%`,
            background: "var(--ink)",
            transition: "width 60ms ease",
          }}
        />
        <input
          type="range"
          min={0}
          max={Math.max(sliderValues.length - 1, 0)}
          step={1}
          value={sliderIndex}
          onChange={(e) => setFromSliderIndex(Number(e.target.value))}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={
            allSelected ? `Tous les ${totalWords} mots` : `${value} mots sur ${totalWords}`
          }
          className="revision-session-word-range relative z-[1] w-full"
        />
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Repères rapides">
        {REVISION_SESSION_WORD_PRESETS.map((preset) => {
          const presetValue = presetRevisionSessionWordLimit(preset, totalWords);
          const active = !allSelected && value === presetValue;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(presetValue)}
              aria-pressed={active}
              className="min-h-[44px] min-w-[44px] rounded-full border px-3 py-1.5 text-xs transition-colors"
              style={{
                fontWeight: active ? 500 : 400,
                borderColor: active ? "var(--ink)" : "var(--line)",
                background: active ? "var(--background-subtle)" : "var(--surface)",
                color: active ? "var(--ink)" : "var(--muted)",
              }}
            >
              {preset}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(totalWords)}
          aria-pressed={allSelected}
          className="min-h-[44px] rounded-full border px-3 py-1.5 text-xs transition-colors"
          style={{
            fontWeight: allSelected ? 500 : 400,
            borderColor: allSelected ? "var(--ink)" : "var(--line)",
            background: allSelected ? "var(--background-subtle)" : "var(--surface)",
            color: allSelected ? "var(--ink)" : "var(--muted)",
          }}
        >
          Tout
        </button>
      </div>
    </div>
  );
}