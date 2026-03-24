"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  User,
  Sprout,
  Flame,
  Gem,
  CreditCard,
  Check,
  Star,
  Plus,
  GraduationCap,
  Clock,
  Activity,
  Calendar,
  Zap,
  Pencil,
} from "lucide-react";

type AvatarType = "arbre" | "phenix" | "koala";

const AVATAR_OPTIONS: {
  value: AvatarType;
  label: string;
  subLabel: string;
  icon: typeof Sprout;
  color: string;
}[] = [
  { value: "arbre", label: "Arbre", subLabel: "Graine → Forêt", icon: Sprout, color: "#1D9E75" },
  { value: "phenix", label: "Phénix", subLabel: "Étincelle → Phénix", icon: Flame, color: "#F5A623" },
  { value: "koala", label: "Cristal", subLabel: "Éclat → Nexus", icon: Gem, color: "#6C3FC8" },
];

type MaClasseRow = {
  id: string;
  title: string;
  language: string | null;
  schoolLevel: string | null;
  status: "pending" | "accepted";
};

const WEEKLY_GOAL_MIN = 5;
const WEEKLY_GOAL_MAX = 70;
const WEEKLY_GOAL_STEP = 5;

function snapWeeklyGoal(n: number): number {
  const s = Math.round(n / WEEKLY_GOAL_STEP) * WEEKLY_GOAL_STEP;
  return Math.min(WEEKLY_GOAL_MAX, Math.max(WEEKLY_GOAL_MIN, s));
}

function getLevelInfo(val: number) {
  if (val <= 10) {
    return {
      label: "Découverte",
      pillBg: "#F0EDF8",
      pillColor: "#6C3FC8",
      time: "~2 min / jour",
    };
  }
  if (val <= 20) {
    return {
      label: "Régulier",
      pillBg: "#FEF8EC",
      pillColor: "#C47D0A",
      time: "~4 min / jour",
    };
  }
  if (val <= 35) {
    return {
      label: "Soutenu",
      pillBg: "#EAF4EF",
      pillColor: "#1D9E75",
      time: "~7 min / jour",
    };
  }
  return {
    label: "Intensif",
    pillBg: "#FCEBEB",
    pillColor: "#E24B4A",
    time: "~12 min / jour",
  };
}

const SLIDER_MARKERS = [
  { v: 10, sub: "Découverte" },
  { v: 20, sub: "Régulier" },
  { v: 35, sub: "Soutenu" },
  { v: 50, sub: "Intensif" },
] as const;

const WEEK_PREVIEW = [
  { label: "Lun", pct: 15, dow: 1 },
  { label: "Mar", pct: 20, dow: 2 },
  { label: "Mer", pct: 15, dow: 3 },
  { label: "Jeu", pct: 15, dow: 4 },
  { label: "Ven", pct: 15, dow: 5 },
  { label: "Sam", pct: 10, dow: 6 },
  { label: "Dim", pct: 10, dow: 0 },
] as const;

const BORDER_TERTIARY = "rgba(108, 63, 200, 0.14)";

export function ParametresClient() {
  const router = useRouter();
  const [avatarType, setAvatarType] = useState<AvatarType>("arbre");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [savedWeeklyGoal, setSavedWeeklyGoal] = useState(20);
  const [goalLoaded, setGoalLoaded] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);

  const [mesClasses, setMesClasses] = useState<MaClasseRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loadMesClasses = useCallback(() => {
    setClassesLoading(true);
    fetch("/api/eleve/classes-avec-listes", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.classes)) {
          setMesClasses(
            data.classes.map((c: MaClasseRow & { status?: string }) => ({
              id: c.id,
              title: c.title,
              language: c.language ?? null,
              schoolLevel: c.schoolLevel ?? null,
              status: c.status === "pending" ? "pending" : "accepted",
            }))
          );
        } else {
          setMesClasses([]);
        }
      })
      .catch(() => setMesClasses([]))
      .finally(() => setClassesLoading(false));
  }, []);

  useEffect(() => {
    loadMesClasses();
  }, [loadMesClasses]);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.avatarType && AVATAR_OPTIONS.some((o) => o.value === d.avatarType)) {
          setAvatarType(d.avatarType);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    fetch("/api/weekly-progress")
      .then((r) => r.json())
      .then((d) => {
        const g =
          typeof d.weeklyGoal === "number" ? d.weeklyGoal : 20;
        const snapped = snapWeeklyGoal(g);
        setWeeklyGoal(snapped);
        setSavedWeeklyGoal(snapped);
        setGoalLoaded(true);
      })
      .catch(() => setGoalLoaded(true));
  }, []);

  const saveAvatarType = (value: AvatarType) => {
    setAvatarType(value);
    setSaving(true);
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarType: value }),
    })
      .then(() => {})
      .finally(() => setSaving(false));
  };

  const persistWeeklyGoal = () => {
    const v = weeklyGoal;
    setGoalSaving(true);
    fetch("/api/weekly-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyGoal: v }),
    })
      .then(() => setSavedWeeklyGoal(v))
      .catch(() => {})
      .finally(() => setGoalSaving(false));
  };

  const cancelWeeklyGoalDraft = () => {
    setWeeklyGoal(savedWeeklyGoal);
  };

  async function handleJoinClass(e: React.FormEvent) {
    e.preventDefault();
    const identifier = joinCode.trim();
    if (!identifier || joinLoading) return;
    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);
    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: string;
        message?: string;
      };
      if (!res.ok) {
        setJoinError(
          typeof data.error === "string"
            ? data.error
            : "Impossible de rejoindre la classe."
        );
        return;
      }
      const st = data.status;
      if (st === "pending") {
        setJoinSuccess(
          "Demande envoyée ! En attente de validation par ton professeur."
        );
      } else if (st === "accepted") {
        setJoinSuccess("Tu as rejoint la classe !");
      } else if (typeof data.message === "string") {
        setJoinSuccess(data.message);
      }
      setJoinCode("");
      loadMesClasses();
    } finally {
      setJoinLoading(false);
    }
  }

  const levelInfo = getLevelInfo(weeklyGoal);
  const sliderFillPct =
    ((weeklyGoal - WEEKLY_GOAL_MIN) / (WEEKLY_GOAL_MAX - WEEKLY_GOAL_MIN)) * 100;
  const todayDow = new Date().getDay();

  return (
    <div className="mx-auto max-w-lg bg-[var(--background)]">
      {/* Bouton retour */}
      <button
        type="button"
        onClick={() => router.push("/app")}
        className="mb-4 flex items-center gap-1 transition hover:opacity-70"
        style={{
          fontSize: 12,
          color: "var(--foreground-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        <ChevronLeft size={14} stroke="var(--foreground-muted)" />
        Retour
      </button>

      {/* Titre */}
      <h1 className="mb-4" style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>
        Paramètres
      </h1>

      {/* -------- Section Avatar -------- */}
      <div
        className="mb-3"
        style={{ background: "var(--background-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16 }}
      >
        <div className="mb-3.5 flex items-start gap-2.5">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 7, background: "var(--background-subtle)" }}
          >
            <User size={14} stroke="#6C3FC8" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Avatar</p>
            <p style={{ fontSize: 11, color: "var(--foreground-muted)", marginTop: 1 }}>
              Choisis ton avatar — il évolue avec ton niveau d&apos;activité.
            </p>
          </div>
        </div>

        {loaded && (
          <div className="grid grid-cols-3 gap-2">
            {AVATAR_OPTIONS.map(({ value, label, subLabel, icon: Icon, color }) => {
              const selected = avatarType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => saveAvatarType(value)}
                  disabled={saving}
                  className="flex flex-col items-center transition-all disabled:opacity-60 card-hover"
                  style={{
                    borderRadius: 10,
                    padding: "12px 8px",
                    textAlign: "center",
                    border: `1.5px solid ${selected ? "#6C3FC8" : "var(--border)"}`,
                    background: selected ? "var(--background-subtle)" : "var(--background-card)",
                    cursor: "pointer",
                    transition: "border-color 120ms, background 120ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = "#6C3FC8";
                      e.currentTarget.style.background = "var(--background-subtle)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--background-card)";
                    }
                  }}
                >
                  <Icon size={26} stroke={color} style={{ marginBottom: 6 }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: selected ? "#6C3FC8" : "var(--foreground-muted)",
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--foreground-disabled)" }}>{subLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* -------- Section Objectif hebdomadaire -------- */}
      <div
        className="mb-3"
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          border: `0.5px solid ${BORDER_TERTIARY}`,
          overflow: "hidden",
        }}
      >
        <style>{`
          .lexiva-weekly-range {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 26px;
            background: transparent;
            margin: 0;
            cursor: pointer;
          }
          .lexiva-weekly-range:focus {
            outline: none;
          }
          .lexiva-weekly-range::-webkit-slider-runnable-track {
            height: 8px;
            background: transparent;
          }
          .lexiva-weekly-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 26px;
            height: 26px;
            margin-top: -9px;
            border-radius: 50%;
            background: white;
            border: 2.5px solid #6C3FC8;
            box-shadow: 0 2px 8px rgba(108,63,200,0.25);
          }
          .lexiva-weekly-range:active::-webkit-slider-thumb {
            transform: scale(1.15);
            box-shadow: 0 4px 14px rgba(108,63,200,0.35);
          }
          .lexiva-weekly-range::-moz-range-track {
            height: 8px;
            background: transparent;
          }
          .lexiva-weekly-range::-moz-range-thumb {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: white;
            border: 2.5px solid #6C3FC8;
            box-shadow: 0 2px 8px rgba(108,63,200,0.25);
          }
          .lexiva-weekly-range:active::-moz-range-thumb {
            transform: scale(1.15);
            box-shadow: 0 4px 14px rgba(108,63,200,0.35);
          }
          .param-weekly-custom:focus-within {
            border-color: #6C3FC8 !important;
            background: #F8F7FF !important;
          }
        `}</style>

        {!goalLoaded ? (
          <div
            style={{
              padding: 28,
              textAlign: "center",
              fontSize: 13,
              color: "var(--foreground-muted)",
            }}
          >
            Chargement…
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: "20px 22px 18px",
                borderBottom: `0.5px solid ${BORDER_TERTIARY}`,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#6C3FC8",
                }}
              >
                <Clock size={20} stroke="white" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--foreground)",
                  }}
                >
                  Objectif hebdomadaire
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--foreground-muted)",
                    marginTop: 2,
                    lineHeight: 1.35,
                  }}
                >
                  Combien de mots veux-tu maîtriser cette semaine ?
                </p>
              </div>
              <div
                className="shrink-0"
                style={{
                  background: "#F0EDF8",
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#6C3FC8",
                }}
              >
                {weeklyGoal} mots / sem.
              </div>
            </div>

            {/* Hero */}
            <div
              style={{
                padding: "28px 22px 0",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  style={{
                    fontSize: 64,
                    fontWeight: 500,
                    color: "#6C3FC8",
                    lineHeight: 1,
                    letterSpacing: "-2px",
                  }}
                >
                  {weeklyGoal}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--foreground-muted)",
                    marginTop: 4,
                  }}
                >
                  mots par semaine
                </p>
              </div>
              <div
                className="flex shrink-0 flex-col items-end"
                style={{ gap: 8 }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "5px 14px",
                    borderRadius: 20,
                    background: levelInfo.pillBg,
                    color: levelInfo.pillColor,
                  }}
                >
                  {levelInfo.label}
                </span>
                <div
                  className="flex items-center gap-1"
                  style={{ color: "var(--foreground-muted)", fontSize: 12 }}
                >
                  <Clock size={11} stroke="currentColor" strokeWidth={2} />
                  <span>{levelInfo.time}</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: "#1D9E75" }}>
                  <Activity size={11} stroke="#1D9E75" strokeWidth={2} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>
                    ~{(weeklyGoal * 52).toLocaleString("fr-FR")} mots / an
                  </span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div style={{ padding: "24px 22px 8px" }}>
              <div
                style={{
                  position: "relative",
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 8,
                    borderRadius: 4,
                    background: "#F0EDF8",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 8,
                    borderRadius: 4,
                    width: `${sliderFillPct}%`,
                    background: "linear-gradient(to right, #9B6EE8, #6C3FC8)",
                    transition: "width 60ms ease",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="range"
                  className="lexiva-weekly-range"
                  min={WEEKLY_GOAL_MIN}
                  max={WEEKLY_GOAL_MAX}
                  step={WEEKLY_GOAL_STEP}
                  value={weeklyGoal}
                  onChange={(e) =>
                    setWeeklyGoal(snapWeeklyGoal(Number(e.target.value)))
                  }
                  aria-label="Objectif hebdomadaire en mots"
                  style={{ position: "relative", zIndex: 1 }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 12,
                  marginBottom: 4,
                }}
              >
                {SLIDER_MARKERS.map(({ v, sub }) => {
                  const active = weeklyGoal >= v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setWeeklyGoal(v)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 1,
                          height: active ? 10 : 8,
                          background: active ? "#6C3FC8" : "var(--border)",
                          borderRadius: 1,
                        }}
                      />
                      <span
                        style={{
                          fontSize: active ? 13 : 12,
                          fontWeight: active ? 500 : 400,
                          color: active ? "#6C3FC8" : "var(--foreground-muted)",
                        }}
                      >
                        {v}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--foreground-muted)",
                        }}
                      >
                        {sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                padding: "20px 22px 0",
              }}
            >
              <div
                style={{
                  background: "#F8F7FF",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  className="mx-auto mb-2 flex items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#F0EDF8",
                  }}
                >
                  <Calendar size={14} stroke="#6C3FC8" strokeWidth={2} />
                </div>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: "var(--foreground)",
                  }}
                >
                  {Math.ceil(weeklyGoal / 7)}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--foreground-muted)",
                    marginTop: 2,
                  }}
                >
                  mots par jour
                </p>
              </div>
              <div
                style={{
                  background: "#F8F7FF",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  className="mx-auto mb-2 flex items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#FEF3DC",
                  }}
                >
                  <Zap size={14} stroke="#F5A623" strokeWidth={2} />
                </div>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: "var(--foreground)",
                  }}
                >
                  {Math.ceil((weeklyGoal / 7) * 1.5)} min
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--foreground-muted)",
                    marginTop: 2,
                  }}
                >
                  min estimées / jour
                </p>
              </div>
              <div
                style={{
                  background: "#F8F7FF",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  className="mx-auto mb-2 flex items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "#EAF4EF",
                  }}
                >
                  <Activity size={14} stroke="#1D9E75" strokeWidth={2} />
                </div>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: "var(--foreground)",
                  }}
                >
                  {(weeklyGoal * 52).toLocaleString("fr-FR")}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--foreground-muted)",
                    marginTop: 2,
                  }}
                >
                  mots maîtrisés / an
                </p>
              </div>
            </div>

            {/* Aperçu semaine */}
            <div style={{ padding: "20px 22px 0" }}>
              <p
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--foreground-muted)",
                  marginBottom: 10,
                }}
              >
                Répartition suggérée
              </p>
              <div
                style={{
                  height: 52,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {WEEK_PREVIEW.map(({ label, pct, dow }) => {
                  const isToday = todayDow === dow;
                  const h = Math.max(
                    3,
                    (weeklyGoal / WEEKLY_GOAL_MAX) * 52 * (pct / 20)
                  );
                  return (
                    <div
                      key={label}
                      className="flex min-w-0 flex-1 flex-col items-center justify-end"
                      style={{ height: 52 }}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: 40,
                          height: h,
                          borderRadius: "5px 5px 0 0",
                          background: isToday ? "#6C3FC8" : "#DDD6F5",
                          transition:
                            "height 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          color: "var(--foreground-muted)",
                          marginTop: 4,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personnalisé */}
            <div style={{ padding: "16px 22px 0" }}>
              <div
                className="param-weekly-custom flex items-center gap-3"
                style={{
                  border: `1.5px solid ${BORDER_TERTIARY}`,
                  borderRadius: 12,
                  padding: "11px 14px",
                }}
              >
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 30,
                    height: 30,
                    background: "#F0EDF8",
                    borderRadius: 8,
                  }}
                >
                  <Pencil size={14} stroke="#6C3FC8" strokeWidth={2} />
                </div>
                <span
                  className="min-w-0 flex-1"
                  style={{ fontSize: 12, color: "var(--foreground-muted)" }}
                >
                  Valeur personnalisée
                </span>
                <input
                  type="number"
                  min={WEEKLY_GOAL_MIN}
                  max={WEEKLY_GOAL_MAX}
                  step={WEEKLY_GOAL_STEP}
                  value={weeklyGoal}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isNaN(n)) return;
                    setWeeklyGoal(snapWeeklyGoal(n));
                  }}
                  style={{
                    width: 52,
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#6C3FC8",
                    textAlign: "center",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                  }}
                  aria-label="Valeur personnalisée mots par semaine"
                />
                <span
                  className="shrink-0"
                  style={{ fontSize: 11, color: "var(--foreground-muted)" }}
                >
                  mots / sem.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "20px 22px",
                display: "flex",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={cancelWeeklyGoalDraft}
                disabled={goalSaving}
                className="flex-1"
                style={{
                  border: "1.5px solid var(--border)",
                  background: "transparent",
                  color: "var(--foreground-muted)",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={persistWeeklyGoal}
                disabled={goalSaving}
                className="flex flex-[2] items-center justify-center gap-2 border-0 text-white"
                style={{
                  background: "#6C3FC8",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Check size={13} stroke="white" strokeWidth={2.5} />
                Enregistrer l&apos;objectif
              </button>
            </div>
          </>
        )}
      </div>

      {/* -------- Section Abonnement & Paiement -------- */}
      <div
        style={{ background: "var(--background-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 16 }}
      >
        {/* Header section */}
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 7, background: "#FEF3DC" }}
          >
            <CreditCard size={14} stroke="#C47D0A" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
            Abonnement &amp; paiement
          </p>
        </div>

        {/* Pill plan actif */}
        <span
          className="mb-3 inline-flex items-center gap-[5px]"
          style={{
            background: "#EAF4EF",
            color: "#1A6645",
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 8,
          }}
        >
          <Check size={10} stroke="#1A6645" />
          Plan Étudiant — actif
        </span>

        {/* Détails plan */}
        <div
          className="mb-3"
          style={{ background: "var(--background-subtle)", borderRadius: 10, padding: "12px 14px" }}
        >
          <PlanRow label="Tarif" value="6 € / mois" />
          <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />
          <PlanRow label="Prochain renouvellement" value="—" />
          <div style={{ borderTop: "0.5px solid var(--border)", margin: "4px 0" }} />
          <PlanRow label="Statut" value="✓ Actif" valueColor="#1D9E75" />
        </div>

        {/* Boutons actions */}
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-[5px] transition hover:brightness-95"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: 9,
              borderRadius: 10,
              border: "1.5px solid #6C3FC8",
              background: "transparent",
              color: "#6C3FC8",
              cursor: "pointer",
            }}
          >
            <CreditCard size={11} stroke="#6C3FC8" />
            Gérer
          </button>
          <button
            type="button"
            className="flex flex-[2] items-center justify-center gap-[5px] transition hover:brightness-95"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: 9,
              borderRadius: 10,
              border: "none",
              background: "#F5A623",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Star size={11} stroke="white" />
            Passer à l&apos;annuel — 50&nbsp;€/an
          </button>
        </div>

        {/* Méthode de paiement */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--foreground-muted)",
            marginBottom: 8,
          }}
        >
          Méthode de paiement
        </p>

        {/* Carte placeholder */}
        <div
          className="mb-2 flex items-center gap-2.5"
          style={{ background: "var(--background-subtle)", borderRadius: 10, padding: "10px 14px" }}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 32,
              height: 22,
              borderRadius: 4,
              background: "#1A1F71",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            VISA
          </div>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}>
              •••• •••• •••• 4242
            </p>
            <p style={{ fontSize: 11, color: "var(--foreground-disabled)" }}>Expire 12/27</p>
          </div>
          <button
            type="button"
            className="shrink-0 transition hover:opacity-70"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#6C3FC8",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Modifier
          </button>
        </div>

        {/* Bouton ajouter carte */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-[5px] transition hover:bg-[var(--hover-bg)]"
          style={{
            fontSize: 12,
            color: "#6C3FC8",
            background: "transparent",
            border: "1.5px dashed #DDD6F5",
            borderRadius: 10,
            padding: 9,
            cursor: "pointer",
          }}
        >
          <Plus size={12} stroke="#6C3FC8" />
          Ajouter une carte
        </button>
      </div>

      {/* -------- Section Ma classe -------- */}
      <div
        className="mb-3 mt-3"
        style={{
          background: "white",
          border: "0.5px solid var(--border)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--background-subtle)",
            }}
          >
            <GraduationCap size={14} stroke="#6C3FC8" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
            Ma classe
          </p>
        </div>

        {classesLoading ? (
          <p style={{ fontSize: 12, color: "var(--foreground-muted)", margin: "0 0 12px" }}>
            Chargement…
          </p>
        ) : mesClasses.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--foreground-muted)", margin: "0 0 12px" }}>
            Tu n&apos;as pas encore rejoint de classe.
          </p>
        ) : (
          <ul className="m-0 mb-3 list-none space-y-2 p-0">
            {mesClasses.map((c, idx) => (
              <li
                key={c.id}
                style={{
                  borderBottom:
                    idx === mesClasses.length - 1
                      ? "none"
                      : "0.5px solid var(--border)",
                  paddingBottom: idx === mesClasses.length - 1 ? 0 : 8,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--foreground)",
                    margin: 0,
                  }}
                >
                  {c.title}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--foreground-muted)",
                    margin: "4px 0 0",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {c.schoolLevel ? (
                    <span>{c.schoolLevel}</span>
                  ) : null}
                  {c.schoolLevel ? (
                    <span style={{ color: "var(--border)" }} aria-hidden>
                      ·
                    </span>
                  ) : null}
                  {c.status === "accepted" ? (
                    <span
                      style={{
                        background: "#EAF4EF",
                        color: "#1D9E75",
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      Membre
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#FEF3DC",
                        color: "#F5A623",
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      En attente
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleJoinClass} className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinError(null);
              setJoinSuccess(null);
            }}
            placeholder="Code de la classe (ex. LX-F2H2QU)"
            disabled={joinLoading}
            className="min-w-0 flex-1 outline-none"
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 14,
              fontFamily: "'DM Sans', var(--font-sans, system-ui), sans-serif",
              color: "var(--foreground)",
              background: "var(--background-card)",
            }}
            autoComplete="off"
            aria-label="Code de la classe"
          />
          <button
            type="submit"
            disabled={joinLoading || !joinCode.trim()}
            className="shrink-0 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "#6C3FC8",
              color: "white",
              borderRadius: 20,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            {joinLoading ? "Rejoindre…" : "Rejoindre"}
          </button>
        </form>

        {joinSuccess ? (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 12,
              color: "#1D9E75",
            }}
          >
            {joinSuccess}
          </p>
        ) : null}
        {joinError ? (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 12,
              color: "#E24B4A",
            }}
          >
            {joinError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PlanRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "4px 0" }}>
      <span style={{ fontSize: 12, color: "var(--foreground-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: valueColor ?? "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}
