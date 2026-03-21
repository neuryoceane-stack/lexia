"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Données des courbes                                               */
/* ------------------------------------------------------------------ */

const DAYS = 60;
const MILESTONES = [1, 3, 7, 21, 60];

function forgetCurve(day: number): number {
  return 100 * Math.exp(-0.08 * day);
}

const LEXIVA_KEYFRAMES: [number, number][] = [
  [0, 100], [1, 95], [2, 72], [3, 92], [5, 75],
  [7, 90], [10, 78], [14, 88], [21, 92], [30, 89], [45, 91], [60, 93],
];

function lexivaCurve(): number[] {
  const pts: number[] = [];
  for (let d = 0; d <= DAYS; d++) {
    let lo = LEXIVA_KEYFRAMES[0];
    let hi = LEXIVA_KEYFRAMES[LEXIVA_KEYFRAMES.length - 1];
    for (let k = 0; k < LEXIVA_KEYFRAMES.length - 1; k++) {
      if (d >= LEXIVA_KEYFRAMES[k][0] && d <= LEXIVA_KEYFRAMES[k + 1][0]) {
        lo = LEXIVA_KEYFRAMES[k];
        hi = LEXIVA_KEYFRAMES[k + 1];
        break;
      }
    }
    const t = hi[0] === lo[0] ? 0 : (d - lo[0]) / (hi[0] - lo[0]);
    pts.push(lo[1] + t * (hi[1] - lo[1]));
  }
  return pts;
}

const LEXIVA_PTS = lexivaCurve();

/* ------------------------------------------------------------------ */
/*  Composant SVG du professeur                                       */
/* ------------------------------------------------------------------ */

function ProfSvg({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Corps */}
      <rect x="18" y="30" width="28" height="26" rx="8" fill="#6C3FC8" />
      {/* Bras */}
      <rect x="10" y="34" width="8" height="4" rx="2" fill="#6C3FC8" />
      <rect x="46" y="32" width="12" height="3" rx="1.5" fill="#6C3FC8" transform="rotate(-30 46 32)" />
      {/* Baguette */}
      <rect x="52" y="22" width="2.5" height="16" rx="1" fill="#F5A623" transform="rotate(-30 53 30)" />
      <circle cx="56" cy="19" r="3" fill="#F5A623" opacity="0.7" />
      {/* Tête */}
      <circle cx="32" cy="22" r="13" fill="#F5DEB3" />
      {/* Yeux */}
      <circle cx="27" cy="20" r="2" fill="#1a1a1a" />
      <circle cx="37" cy="20" r="2" fill="#1a1a1a" />
      {/* Bouche */}
      <path d="M28 26 Q32 30 36 26" stroke="#1a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Toque */}
      <rect x="20" y="8" width="24" height="6" rx="2" fill="#F5A623" />
      <rect x="24" y="4" width="16" height="6" rx="2" fill="#F5A623" />
      <rect x="28" y="2" width="8" height="4" rx="1" fill="#F5A623" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Graphique animé SVG                                               */
/* ------------------------------------------------------------------ */

const CW = 440;
const CH = 180;
const PAD = { top: 20, right: 16, bottom: 28, left: 36 };
const GW = CW - PAD.left - PAD.right;
const GH = CH - PAD.top - PAD.bottom;

function x(day: number) { return PAD.left + (day / DAYS) * GW; }
function y(val: number) { return PAD.top + GH - (val / 100) * GH; }

function buildPath(pts: number[]): string {
  return pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
}

const FORGET_PATH = buildPath(Array.from({ length: DAYS + 1 }, (_, i) => forgetCurve(i)));
const LEXIVA_PATH = buildPath(LEXIVA_PTS);

function AnimatedChart({ play }: { play: boolean }) {
  const forgetRef = useRef<SVGPathElement>(null);
  const lexivaRef = useRef<SVGPathElement>(null);
  const [showMilestones, setShowMilestones] = useState(false);
  const animId = useRef(0);

  const animate = useCallback(() => {
    setShowMilestones(false);
    const paths = [forgetRef.current, lexivaRef.current];
    paths.forEach((p) => {
      if (!p) return;
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });

    const dur = 1800;
    const start = performance.now();
    const id = ++animId.current;

    const tick = (now: number) => {
      if (id !== animId.current) return;
      const t = Math.min((now - start) / dur, 1);
      paths.forEach((p) => {
        if (!p) return;
        const len = p.getTotalLength();
        p.style.strokeDashoffset = `${len * (1 - t)}`;
      });
      if (t < 1) requestAnimationFrame(tick);
      else setShowMilestones(true);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (play) animate();
  }, [play, animate]);

  const yLabels = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ maxWidth: CW }}>
      {/* Grille horizontale */}
      {yLabels.map((v) => (
        <g key={v}>
          <line x1={PAD.left} y1={y(v)} x2={CW - PAD.right} y2={y(v)} stroke="var(--border)" strokeWidth="0.5" />
          <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" fill="var(--foreground-disabled)" fontSize="9">{v}%</text>
        </g>
      ))}

      {/* Axe des X labels */}
      {[0, 15, 30, 45, 60].map((d) => (
        <text key={d} x={x(d)} y={CH - 6} textAnchor="middle" fill="var(--foreground-disabled)" fontSize="9">J+{d}</text>
      ))}

      {/* Courbe oubli */}
      <path ref={forgetRef} d={FORGET_PATH} fill="none" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Courbe Lexiva */}
      <path ref={lexivaRef} d={LEXIVA_PATH} fill="none" stroke="#6C3FC8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Jalons */}
      {showMilestones && MILESTONES.map((d) => (
        <g key={d}>
          <line x1={x(d)} y1={PAD.top} x2={x(d)} y2={PAD.top + GH} stroke="#6C3FC8" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
          <rect x={x(d) - 14} y={PAD.top - 14} width="28" height="14" rx="4" fill="var(--background-subtle)" stroke="#DDD6F5" strokeWidth="0.5" />
          <text x={x(d)} y={PAD.top - 4} textAnchor="middle" fill="#6C3FC8" fontSize="8" fontWeight="500">J+{d}</text>
        </g>
      ))}

      {/* Légende */}
      <circle cx={PAD.left + 4} cy={CH - 7} r="3" fill="#E24B4A" />
      <text x={PAD.left + 12} y={CH - 4} fill="var(--foreground-muted)" fontSize="8">Oubli naturel</text>
      <circle cx={PAD.left + 90} cy={CH - 7} r="3" fill="#6C3FC8" />
      <text x={PAD.left + 98} y={CH - 4} fill="var(--foreground-muted)" fontSize="8">Avec Lexiva</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Modale                                                            */
/* ------------------------------------------------------------------ */

export function ProfesseurSM2Modal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [playChart, setPlayChart] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setPlayChart(true), 400);
      return () => clearTimeout(t);
    }
    setPlayChart(false);
  }, [open]);

  if (!open) return null;

  const replay = () => {
    setPlayChart(false);
    requestAnimationFrame(() => setPlayChart(true));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      style={{ background: "rgba(80,60,120,0.22)" }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: 500,
          borderRadius: 20,
          background: "var(--background-card)",
          border: "0.5px solid rgba(108,63,200,0.15)",
          margin: "24px 0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header violet ── */}
        <div
          className="flex items-center gap-3"
          style={{ background: "#6C3FC8", padding: "20px 22px" }}
        >
          <ProfSvg size={52} />
          <div className="min-w-0 flex-1">
            <p style={{ color: "white", fontSize: 16, fontWeight: 500, marginBottom: 2 }}>
              Professeur SM-2
            </p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
              L&apos;algorithme qui connaît ton cerveau mieux que toi
            </p>
          </div>
        </div>

        {/* ── Corps ── */}
        <div style={{ padding: "20px 22px 0" }}>
          {/* Bulle de dialogue */}
          <div className="mb-4 flex gap-3">
            <div className="shrink-0 pt-0.5">
              <ProfSvg size={28} />
            </div>
            <div
              style={{
                background: "var(--background-subtle)",
                borderRadius: "2px 12px 12px 12px",
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--foreground)",
              }}
            >
              Ton cerveau oublie <strong>50%</strong> d&apos;un mot nouveau en 24h.
              Mais si tu le révises <em>juste avant d&apos;oublier</em>,
              l&apos;intervalle double à chaque fois. C&apos;est ça,{" "}
              <strong>SM-2</strong> — l&apos;algorithme inventé par Piotr
              Woźniak en 1987.
            </div>
          </div>

          {/* Pills intervalles */}
          <div className="mb-4 flex flex-wrap justify-center gap-[6px]">
            {["J+1 → 2j", "J+3 → 6j", "J+7 → 14j", "J+21 → maîtrisé"].map(
              (t) => (
                <span
                  key={t}
                  className="inline-flex items-center"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: 8,
                    background: "var(--background-subtle)",
                    color: "#4B3A9E",
                  }}
                >
                  {t}
                </span>
              )
            )}
          </div>

          {/* Graphique */}
          <div
            className="mb-4"
            style={{
              background: "var(--background-card)",
              border: "0.5px solid var(--border)",
              borderRadius: 12,
              padding: "12px 8px 4px",
            }}
          >
            <AnimatedChart play={playChart} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between gap-3"
          style={{
            background: "var(--background-subtle)",
            borderTop: "0.5px solid var(--border)",
            padding: "14px 22px",
          }}
        >
          <p style={{ fontSize: 11, color: "var(--foreground-muted)", lineHeight: 1.5, flex: 1 }}>
            Lexiva calcule le moment exact où réviser — ni trop tôt, ni trop tard.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={replay}
              className="transition hover:brightness-95"
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 10,
                border: "1.5px solid var(--border)",
                background: "var(--background-card)",
                color: "var(--foreground-muted)",
                cursor: "pointer",
              }}
            >
              Rejouer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="transition hover:brightness-95"
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 10,
                border: "none",
                background: "#6C3FC8",
                color: "white",
                cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
