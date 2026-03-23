"use client";

import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export interface SessionEndScreenProps {
  wordsSeen: number;
  wordsRetained: number;
  wordsWritten?: number;
  durationStr: string;
  mode: "flashcard" | "dictee";
  onNewSession: () => void;
  onHome: () => void;
}

const VIOLET = "#6C3FC8";
const GOLD = "#F5A623";
const GREEN = "#1D9E75";
const BG_PAGE = "#F8F7FF";

const CONFETTI_COLORS = [VIOLET, GOLD, GREEN] as const;
/** Positions left % (5–95), déterministes pour SSR. */
const CONFETTI_LEFT_PCT: readonly number[] = [
  12, 88, 24, 76, 41, 59, 8, 92, 35, 65, 18, 82, 48, 52, 29, 71, 55, 45, 67, 33,
];

function performanceBadge(percent: number): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  if (percent < 50) {
    return {
      label: "Bien",
      bg: "#EFF6FF",
      text: "#3B82F6",
      border: "#BFDBFE",
    };
  }
  if (percent <= 80) {
    return {
      label: "Super !",
      bg: "#EDE9FD",
      text: VIOLET,
      border: "#C4B5FD",
    };
  }
  return {
    label: "Parfait !",
    bg: "#FFF7E6",
    text: "#D97706",
    border: "#FDE68A",
  };
}

function TargetIcon() {
  return (
    <svg
      width={80}
      height={80}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto block"
      aria-hidden
    >
      <circle
        cx={40}
        cy={40}
        r={36}
        fill="none"
        stroke={VIOLET}
        strokeWidth={3}
      />
      <circle
        cx={40}
        cy={40}
        r={22}
        fill="none"
        stroke={GOLD}
        strokeWidth={3}
      />
      <circle cx={40} cy={40} r={9} fill={VIOLET} />
      {/* Flèche (diagonale + pointe en V vers le centre) */}
      <path
        d="M 10 10 L 30 30 M 24 26 L 30 30 M 26 24 L 30 30"
        fill="none"
        stroke={GREEN}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConfettiLayer({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      <style>{`
        @keyframes session-end-confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(300px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        aria-hidden
      >
        {CONFETTI_LEFT_PCT.map((leftPct, i) => {
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
          const isRect = i % 2 === 0;
          const delayMs = i * 30;
          return (
            <span
              key={i}
              className="absolute top-0"
              style={{
                left: `${leftPct}%`,
                width: isRect ? 6 : 7,
                height: isRect ? 10 : 7,
                backgroundColor: color,
                transform: `rotate(${i * 17}deg)`,
                animation: `session-end-confetti-fall 1.8s linear forwards`,
                animationDelay: `${delayMs}ms`,
              }}
            />
          );
        })}
      </div>
    </>
  );
}

export default function SessionEndScreen({
  wordsSeen,
  wordsRetained,
  wordsWritten,
  durationStr,
  mode,
  onNewSession,
  onHome,
}: SessionEndScreenProps) {
  const percent =
    wordsSeen > 0 ? Math.round((wordsRetained / wordsSeen) * 100) : 0;
  const badge = performanceBadge(percent);
  const showConfetti = percent > 80;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${dmSans.className}`}
      style={{ backgroundColor: BG_PAGE }}
    >
      <div
        className="animate-session-end-enter relative w-full max-w-[420px] rounded-2xl bg-white px-8 py-8 shadow-lg"
        style={{ padding: 32, borderRadius: 16 }}
      >
        <style>{`
          @keyframes session-end-enter {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-session-end-enter {
            animation: session-end-enter 0.4s ease-out forwards;
          }
        `}</style>

        <ConfettiLayer show={showConfetti} />

        <div className="relative z-[1] flex flex-col items-center text-center">
          <TargetIcon />

          <h1
            className="mt-5 text-center font-medium"
            style={{
              marginTop: 20,
              fontSize: 26,
              fontWeight: 500,
              color: "#1a1a2e",
            }}
          >
            Session terminée !
          </h1>

          <span
            className="mt-3 inline-flex border font-medium"
            style={{
              marginTop: 12,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: badge.border,
              backgroundColor: badge.bg,
              color: badge.text,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            {badge.label}
          </span>

          <p
            className="mt-2 text-center font-normal"
            style={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}
          >
            {wordsSeen > 0
              ? `(${wordsRetained} / ${wordsSeen} mots maîtrisés)`
              : "(0 mots maîtrisés)"}
          </p>
          {mode === "dictee" && (
            <p
              className="mt-1 text-center font-normal"
              style={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}
            >
              ({typeof wordsWritten === "number" ? wordsWritten : 0} mots écrits)
            </p>
          )}

          <div className="mt-5 flex flex-col items-center" style={{ marginTop: 20 }}>
            <p
              className="font-medium"
              style={{
                fontSize: 48,
                fontWeight: 500,
                color: "#C4B5FD",
                lineHeight: 1.1,
              }}
            >
              — XP
            </p>
            <p
              className="mt-1 text-center font-normal"
              style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400 }}
            >
              points d&apos;expérience — bientôt disponible
            </p>
          </div>

          <p
            className="mt-3 font-normal"
            style={{
              marginTop: 12,
              fontSize: 15,
              color: "#6B7280",
              fontWeight: 400,
            }}
          >
            ⏱ {durationStr}
          </p>

          <div
            className="flex w-full flex-col"
            style={{ marginTop: 28, gap: 12 }}
          >
            <button
              type="button"
              onClick={onHome}
              className="w-full font-medium text-white transition-colors duration-200"
              style={{
                backgroundColor: VIOLET,
                padding: 14,
                borderRadius: 20,
                fontSize: 16,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#5a35a8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = VIOLET;
              }}
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={onNewSession}
              className="w-full border-2 bg-transparent font-medium transition-colors duration-200"
              style={{
                borderColor: VIOLET,
                color: VIOLET,
                padding: 12,
                borderRadius: 20,
                fontSize: 15,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#EDE9FD";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Nouvelle session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
