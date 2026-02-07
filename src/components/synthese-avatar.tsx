"use client";

/** État 1 = inactif, 2 = reprise légère, 3 = normal, 4 = forte progression, 5 = maximal */
export type AvatarState = 1 | 2 | 3 | 4 | 5;
export type AvatarType = "arbre" | "phenix" | "koala";

const stateLabels: Record<AvatarState, string> = {
  1: "Inactif",
  2: "Reprise légère",
  3: "Progression normale",
  4: "Forte progression",
  5: "Suprême",
};

export function SyntheseAvatar({
  state,
  type,
  className,
  showLabel,
}: {
  state: AvatarState;
  type: AvatarType;
  className?: string;
  showLabel?: boolean;
}) {
  const opacity = 0.3 + (state / 5) * 0.7;
  const scale = 0.7 + (state / 5) * 0.5;

  return (
    <div
      className={`flex flex-col items-center justify-center ${className ?? ""}`}
      aria-hidden
    >
      <div
        className="flex items-center justify-center transition-transform duration-300"
        style={{ transform: `scale(${scale})` }}
      >
        {type === "arbre" && <AvatarArbre state={state} opacity={opacity} />}
        {type === "phenix" && <AvatarPhenix state={state} opacity={opacity} />}
        {type === "koala" && <AvatarKoala state={state} opacity={opacity} />}
      </div>
      {showLabel && (
        <p className="mt-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
          {stateLabels[state]}
        </p>
      )}
    </div>
  );
}

function AvatarArbre({ state, opacity }: { state: AvatarState; opacity: number }) {
  const height = 24 + state * 8;
  const width = 16 + state * 4;
  const leafGreen = state === 1 ? "#6b7280" : state === 2 ? "#4ade80" : state === 3 ? "#22c55e" : state === 4 ? "#16a34a" : "#15803d";
  const trunkBrown = state === 1 ? "#78716c" : "#a16207";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      className="text-p2-primary"
    >
      <ellipse cx={width / 2} cy={height * 0.35} rx={width * 0.4} ry={height * 0.25} fill={leafGreen} />
      <ellipse cx={width / 2} cy={height * 0.6} rx={width * 0.35} ry={height * 0.22} fill={leafGreen} />
      <rect x={width / 2 - 2} y={height * 0.55} width={4} height={height * 0.45} fill={trunkBrown} />
    </svg>
  );
}

function AvatarPhenix({ state, opacity }: { state: AvatarState; opacity: number }) {
  const size = 32 + state * 4;
  const fill = state === 1 ? "#64748b" : state === 2 ? "#f97316" : state === 3 ? "#ea580c" : state === 4 ? "#c2410c" : "#eab308";
  const stroke = state === 1 ? "#475569" : "#0f172a";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <path
        d="M24 4C24 4 16 12 16 24C16 28 18 32 24 36C30 32 32 28 32 24C32 12 24 4 24 4Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 20L20 28L24 32L28 28L24 20Z"
        fill={state >= 3 ? "#fef08a" : fill}
        opacity={state >= 3 ? 1 : 0.6}
      />
      <path
        d="M14 20C10 24 10 32 14 36M34 20C38 24 38 32 34 36"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
}

function AvatarKoala({ state, opacity }: { state: AvatarState; opacity: number }) {
  const size = 36 + state * 2;
  const eyeOpen = state >= 3;
  const gray = state === 1 ? "#78716c" : state === 2 ? "#a8a29e" : "#57534e";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <circle cx="20" cy="22" r="14" fill={gray} />
      <circle cx="20" cy="22" r="10" fill="#a8a29e" />
      <ellipse cx="14" cy="20" rx="2" ry={eyeOpen ? "2.5" : "0.5"} fill="#1c1917" />
      <ellipse cx="26" cy="20" rx="2" ry={eyeOpen ? "2.5" : "0.5"} fill="#1c1917" />
      <circle cx="20" cy="24" r="2" fill="#1c1917" />
      <path d="M8 18 Q6 14 10 12" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M32 18 Q34 14 30 12" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
