"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  User,
  Sprout,
  Flame,
  Gem,
  Check,
  GraduationCap,
  Clock,
  Activity,
  Calendar,
  Zap,
  Pencil,
  Bell,
  AlarmClock,
  TrendingUp,
  Mail,
  Smartphone,
  Volume2,
  Music,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_REMINDER_SETTINGS,
  parseReminderSettings,
  type ReminderSettings,
} from "@/lib/reminder-settings";
import { SubscriptionSettingsCard } from "./subscription-settings-card";

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
      pillBg: "color-mix(in srgb, var(--ink) 12%, transparent)",
      pillColor: "var(--ink)",
      time: "~2 min / jour",
    };
  }
  if (val <= 20) {
    return {
      label: "Régulier",
      pillBg: "var(--mark)",
      pillColor: "var(--ink)",
      time: "~4 min / jour",
    };
  }
  if (val <= 35) {
    return {
      label: "Soutenu",
      pillBg: "var(--surface)",
      pillColor: "var(--ink)",
      pillBorder: "1.5px solid var(--line)",
      time: "~7 min / jour",
    };
  }
  return {
    label: "Intensif",
    pillBg: "color-mix(in srgb, var(--ink) 12%, transparent)",
    pillColor: "var(--ink)",
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

const BORDER_TERTIARY = "color-mix(in srgb, var(--ink) 14%, transparent)";

const PANEL_SHADOW =
  "0 4px 24px color-mix(in srgb, var(--ink) 12%, transparent), 0 1px 3px color-mix(in srgb, var(--ink) 8%, transparent)";

const SECTION_CARD_STYLE: CSSProperties = {
  background: "var(--surface)",
  border: "0.5px solid color-mix(in srgb, var(--ink) 12%, transparent)",
  borderRadius: 16,
  padding: 16,
  boxShadow: PANEL_SHADOW,
};

export function ParametresClient() {
  const router = useRouter();
  const [avatarType, setAvatarType] = useState<AvatarType>("arbre");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [savedWeeklyGoal, setSavedWeeklyGoal] = useState(20);
  const [goalLoaded, setGoalLoaded] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);

  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [remindersLoaded, setRemindersLoaded] = useState(false);
  const [feedbackSoundsEnabled, setFeedbackSoundsEnabled] = useState(true);
  const [soundPrefsLoaded, setSoundPrefsLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const remindersPersistReady = useRef(false);
  const soundPersistReady = useRef(false);

  const [mesClasses, setMesClasses] = useState<MaClasseRow[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinInputFocused, setJoinInputFocused] = useState(false);
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
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
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
        setReminders(parseReminderSettings(d.reminderSettings));
        setRemindersLoaded(true);
        remindersPersistReady.current = true;
        setFeedbackSoundsEnabled(d.feedbackSoundsEnabled !== false);
        setSoundPrefsLoaded(true);
        soundPersistReady.current = true;
        setLoaded(true);
      })
      .catch(() => {
        setRemindersLoaded(true);
        remindersPersistReady.current = true;
        setSoundPrefsLoaded(true);
        soundPersistReady.current = true;
        setLoaded(true);
      });
  }, []);

  const updateFeedbackSounds = useCallback((enabled: boolean) => {
    setFeedbackSoundsEnabled(enabled);
    if (soundPersistReady.current) {
      fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackSoundsEnabled: enabled }),
      }).catch(() => {});
    }
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

  const updateReminders = useCallback((patch: Partial<ReminderSettings>) => {
    setReminders((prev) => {
      const next = { ...prev, ...patch };
      if (remindersPersistReady.current) {
        fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reminderSettings: next }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

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

  const joinCodeReady = joinCode.trim().length > 0;

  return (
    <div className="mx-auto max-w-lg" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
      <button
        type="button"
        onClick={() => router.push("/app")}
        className="mb-5 flex items-center gap-1 transition hover:opacity-70"
        style={{
          fontSize: 12,
          color: "var(--muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        <ChevronLeft size={14} stroke="var(--muted)" />
        Retour
      </button>

      {/* En-tête identité */}
      <div
        className="relative mb-5 overflow-hidden"
        style={{
          borderRadius: 18,
          padding: "20px 18px",
          boxShadow: PANEL_SHADOW,
          background: "var(--ink)",
        }}
      >
        <div className="relative z-[2]">
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--surface)",
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            Paramètres
          </h1>
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--surface) 75%, transparent)", margin: 0 }}>
            Personnalise ton expérience
          </p>
        </div>
      </div>

      {/* -------- Section Avatar -------- */}
      <div className="mb-3" style={SECTION_CARD_STYLE}>
        <SectionHeader
          icon={User}
          title="Avatar"
          subtitle="Choisis ton avatar — il évolue avec ton niveau d'activité."
        />

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
                  className="flex flex-col items-center justify-center transition-all disabled:opacity-60"
                  style={{
                    borderRadius: 12,
                    padding: "14px 8px",
                    minHeight: 108,
                    textAlign: "center",
                    border: selected
                      ? "1.5px solid var(--ink)"
                      : "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
                    background: selected ? "color-mix(in srgb, var(--ink) 5%, transparent)" : "white",
                    cursor: "pointer",
                    transition: "border-color 120ms, background 120ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = "color-mix(in srgb, var(--ink) 35%, transparent)";
                      e.currentTarget.style.background = "color-mix(in srgb, var(--ink) 3%, transparent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = "color-mix(in srgb, var(--ink) 14%, transparent)";
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  <Icon size={26} stroke={color} style={{ marginBottom: 8 }} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: selected ? "var(--ink)" : "var(--ink)",
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{subLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* -------- Section Objectif hebdomadaire -------- */}
      <div
        className="mb-3"
        style={{ ...SECTION_CARD_STYLE, padding: 0, overflow: "hidden" }}
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
            border: 2.5px solid var(--ink);
            box-shadow: 0 2px 8px color-mix(in srgb, var(--ink) 25%, transparent);
          }
          .lexiva-weekly-range:active::-webkit-slider-thumb {
            transform: scale(1.15);
            box-shadow: 0 4px 14px color-mix(in srgb, var(--ink) 35%, transparent);
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
            border: 2.5px solid var(--ink);
            box-shadow: 0 2px 8px color-mix(in srgb, var(--ink) 25%, transparent);
          }
          .lexiva-weekly-range:active::-moz-range-thumb {
            transform: scale(1.15);
            box-shadow: 0 4px 14px color-mix(in srgb, var(--ink) 35%, transparent);
          }
          .param-weekly-custom:focus-within {
            border-color: var(--ink) !important;
            background: color-mix(in srgb, var(--ink) 6%, transparent) !important;
          }
        `}</style>

        {!goalLoaded ? (
          <div
            style={{
              padding: 28,
              textAlign: "center",
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            Chargement…
          </div>
        ) : (
          <>
            <div style={{ padding: "16px 16px 0" }}>
              <SectionHeader
                icon={Clock}
                title="Objectif hebdomadaire"
                subtitle="Combien de mots veux-tu maîtriser cette semaine ?"
                trailing={
                  <span
                    className="shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--ink) 9%, transparent)",
                      borderRadius: 999,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {weeklyGoal} mots / sem.
                  </span>
                }
              />
            </div>

            {/* Hero */}
            <div
              style={{
                padding: "8px 16px 0",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  style={{
                    fontSize: 64,
                    fontWeight: 600,
                    color: "var(--ink)",
                    lineHeight: 1,
                    letterSpacing: "-2px",
                  }}
                >
                  {weeklyGoal}
                </p>
                <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
                  mots par semaine
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end" style={{ gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "5px 14px",
                    borderRadius: 999,
                    background: levelInfo.pillBg,
                    color: levelInfo.pillColor,
                    border: "pillBorder" in levelInfo ? levelInfo.pillBorder : "none",
                  }}
                >
                  {levelInfo.label}
                </span>
                <div
                  className="flex items-center gap-1"
                  style={{ color: "var(--muted)", fontSize: 12 }}
                >
                  <Clock size={11} stroke="var(--muted)" strokeWidth={2} />
                  <span>{levelInfo.time}</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: "var(--ink)" }}>
                  <Activity size={11} stroke="var(--ink)" strokeWidth={2} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>
                    ~{(weeklyGoal * 52).toLocaleString("fr-FR")} mots / an
                  </span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div style={{ padding: "24px 16px 8px" }}>
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
                    background: "var(--background-subtle)",
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
                    background: "linear-gradient(to right, var(--ink), var(--ink))",
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
                          background: active ? "var(--ink)" : "color-mix(in srgb, var(--ink) 20%, transparent)",
                          borderRadius: 1,
                        }}
                      />
                      <span
                        style={{
                          fontSize: active ? 13 : 12,
                          fontWeight: active ? 600 : 500,
                          color: active ? "var(--ink)" : "var(--muted)",
                        }}
                      >
                        {v}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{sub}</span>
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
                padding: "16px 16px 0",
              }}
            >
              {[
                { icon: Calendar, value: Math.ceil(weeklyGoal / 7), unit: "mots par jour" },
                {
                  icon: Zap,
                  value: `${Math.ceil((weeklyGoal / 7) * 1.5)} min`,
                  unit: "min estimées / jour",
                },
                {
                  icon: Activity,
                  value: (weeklyGoal * 52).toLocaleString("fr-FR"),
                  unit: "mots maîtrisés / an",
                },
              ].map(({ icon: StatIcon, value, unit }) => (
                <div
                  key={unit}
                  style={{
                    background: "color-mix(in srgb, var(--ink) 6%, transparent)",
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
                      borderRadius: 8,
                      background: "color-mix(in srgb, var(--ink) 9%, transparent)",
                    }}
                  >
                    <StatIcon size={14} stroke="var(--ink)" strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{value}</p>
                  <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{unit}</p>
                </div>
              ))}
            </div>

            {/* Aperçu semaine */}
            <div style={{ padding: "16px 16px 0" }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink)",
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
                          background: isToday ? "var(--ink)" : "var(--background-subtle)",
                          transition:
                            "height 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                      />
                      <span style={{ fontSize: 9, color: "var(--muted)", marginTop: 4 }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personnalisé */}
            <div style={{ padding: "16px 16px 0" }}>
              <div
                className="param-weekly-custom flex items-center gap-3"
                style={{
                  border: "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
                  borderRadius: 12,
                  padding: "11px 14px",
                  background: "color-mix(in srgb, var(--ink) 4%, transparent)",
                }}
              >
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 30,
                    height: 30,
                    background: "color-mix(in srgb, var(--ink) 9%, transparent)",
                    borderRadius: 8,
                  }}
                >
                  <Pencil size={14} stroke="var(--ink)" strokeWidth={2} />
                </div>
                <span className="min-w-0 flex-1" style={{ fontSize: 12, color: "var(--muted)" }}>
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
                    color: "var(--ink)",
                    textAlign: "center",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                  }}
                  aria-label="Valeur personnalisée mots par semaine"
                />
                <span className="shrink-0" style={{ fontSize: 11, color: "var(--muted)" }}>
                  mots / sem.
                </span>
              </div>
            </div>

            <div style={{ padding: "16px", display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={cancelWeeklyGoalDraft}
                disabled={goalSaving}
                className="flex-1 transition hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
                style={{
                  border: "1px solid color-mix(in srgb, var(--ink) 25%, transparent)",
                  background: "transparent",
                  color: "var(--muted)",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={persistWeeklyGoal}
                disabled={goalSaving}
                className="flex flex-[2] items-center justify-center gap-2 border-0 text-surface transition hover:brightness-95 disabled:opacity-50"
                style={{
                  background: "var(--ink)",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  fontWeight: 600,
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

      {/* -------- Section Rappels -------- */}
      <div className="mb-3" style={SECTION_CARD_STYLE}>
        <SectionHeader
          icon={Bell}
          title="Rappels"
          subtitle="Choisis quand et comment on te rappelle de réviser."
        />

        {!remindersLoaded ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Chargement…</p>
        ) : (
          <>
            <div
              className="mb-3 flex items-center justify-between gap-3"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "color-mix(in srgb, var(--ink) 4%, transparent)",
              }}
            >
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                  Recevoir des rappels
                </p>
              </div>
              <ToggleSwitch
                checked={reminders.enabled}
                onChange={(v) => updateReminders({ enabled: v })}
                reducedMotion={reducedMotion}
                ariaLabel="Recevoir des rappels"
              />
            </div>

            <div
              style={{
                opacity: reminders.enabled ? 1 : 0.45,
                pointerEvents: reminders.enabled ? "auto" : "none",
                transition: reducedMotion ? "none" : "opacity 150ms ease",
              }}
            >
              <ReminderTypeRow
                icon={AlarmClock}
                label="Rappel de révision"
                description="Chaque jour, si tu as des mots à revoir."
                checked={reminders.revisionEnabled}
                onChange={(v) => updateReminders({ revisionEnabled: v })}
                reducedMotion={reducedMotion}
                disabled={!reminders.enabled}
                trailing={
                  reminders.revisionEnabled ? (
                    <input
                      type="time"
                      value={reminders.revisionTime}
                      onChange={(e) => updateReminders({ revisionTime: e.target.value })}
                      disabled={!reminders.enabled}
                      aria-label="Heure du rappel de révision"
                      style={{
                        border: "1px solid color-mix(in srgb, var(--ink) 25%, transparent)",
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 12,
                        color: "var(--ink)",
                        background: "var(--surface)",
                        outline: "none",
                      }}
                    />
                  ) : null
                }
              />

              <ReminderTypeRow
                icon={Flame}
                label="Alerte de série"
                description="Quand ta série est sur le point de sauter."
                checked={reminders.streakEnabled}
                onChange={(v) => updateReminders({ streakEnabled: v })}
                reducedMotion={reducedMotion}
                disabled={!reminders.enabled}
              />

              <ReminderTypeRow
                icon={TrendingUp}
                label="Bilan hebdomadaire"
                description="Un récap de tes progrès chaque semaine."
                checked={reminders.weeklyRecapEnabled}
                onChange={(v) => updateReminders({ weeklyRecapEnabled: v })}
                reducedMotion={reducedMotion}
                disabled={!reminders.enabled}
                className="mb-4"
              />

              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                Canaux
              </p>

              <ReminderChannelRow
                icon={Mail}
                label="E-mail"
                checked={reminders.emailChannel}
                onChange={(v) => updateReminders({ emailChannel: v })}
                reducedMotion={reducedMotion}
                disabled={!reminders.enabled}
              />

              <ReminderChannelRow
                icon={Smartphone}
                label="Notifications push"
                checked={reminders.pushChannel}
                onChange={(v) => updateReminders({ pushChannel: v })}
                reducedMotion={reducedMotion}
                disabled={!reminders.enabled}
              />
            </div>
          </>
        )}
      </div>

      {/* -------- Section Son -------- */}
      <div className="mb-3" style={SECTION_CARD_STYLE}>
        <SectionHeader
          icon={Volume2}
          title="Son"
          subtitle="Gère les sons de l'application."
        />

        {!soundPrefsLoaded ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Chargement…</p>
        ) : (
          <ReminderTypeRow
            icon={Music}
            label="Sons de feedback"
            description="Un son quand ta réponse est juste ou fausse, pendant la révision."
            checked={feedbackSoundsEnabled}
            onChange={updateFeedbackSounds}
            reducedMotion={reducedMotion}
            className="mb-0"
          />
        )}
      </div>

      <SubscriptionSettingsCard />

      {/* -------- Section Ma classe -------- */}
      <div className="mb-3" style={SECTION_CARD_STYLE}>
        <SectionHeader
          icon={GraduationCap}
          title="Ma classe"
          subtitle="Rejoins une classe avec le code fourni par ton professeur."
        />

        {classesLoading ? (
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>Chargement…</p>
        ) : mesClasses.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>
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
                      : "0.5px solid color-mix(in srgb, var(--ink) 10%, transparent)",
                  paddingBottom: idx === mesClasses.length - 1 ? 0 : 8,
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                  {c.title}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    margin: "4px 0 0",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {c.schoolLevel ? <span>{c.schoolLevel}</span> : null}
                  {c.schoolLevel ? (
                    <span style={{ color: "color-mix(in srgb, var(--ink) 20%, transparent)" }} aria-hidden>
                      ·
                    </span>
                  ) : null}
                  {c.status === "accepted" ? (
                    <span
                      style={{
                        background: "var(--surface)",
                        color: "var(--ink)",
                        border: "1px solid var(--line)",
                        borderRadius: 999,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Membre
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "var(--mark)",
                        color: "var(--ink)",
                        borderRadius: 999,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 600,
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
            onFocus={() => setJoinInputFocused(true)}
            onBlur={() => setJoinInputFocused(false)}
            placeholder="Code de la classe (ex. LX-F2H2QU)"
            disabled={joinLoading}
            className="min-w-0 flex-1"
            style={{
              border: joinInputFocused
                ? "1px solid var(--ink)"
                : "1px solid color-mix(in srgb, var(--ink) 20%, transparent)",
              boxShadow: joinInputFocused ? "0 0 0 2px color-mix(in srgb, var(--ink) 25%, transparent)" : "none",
              outline: "none",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              color: "var(--ink)",
              background: "color-mix(in srgb, var(--ink) 4%, transparent)",
            }}
            autoComplete="off"
            aria-label="Code de la classe"
          />
          <button
            type="submit"
            disabled={joinLoading || !joinCodeReady}
            className="shrink-0 transition hover:brightness-95 disabled:cursor-not-allowed"
            style={{
              background: joinCodeReady ? "var(--ink)" : "color-mix(in srgb, var(--ink) 8%, transparent)",
              color: joinCodeReady ? "white" : "var(--muted)",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: joinCodeReady && !joinLoading ? "pointer" : "not-allowed",
              opacity: joinLoading && joinCodeReady ? 0.7 : 1,
            }}
          >
            {joinLoading ? "Rejoindre…" : "Rejoindre"}
          </button>
        </form>

        {joinSuccess ? (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--ink)" }}>{joinSuccess}</p>
        ) : null}
        {joinError ? (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--false-text)" }}>{joinError}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  trailing,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: "color-mix(in srgb, var(--ink) 9%, transparent)",
        }}
      >
        <Icon size={16} stroke="var(--ink)" />
      </div>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{title}</p>
        {subtitle ? (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.35 }}>{subtitle}</p>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  reducedMotion,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  reducedMotion?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        border: "none",
        padding: 2,
        flexShrink: 0,
        background: checked ? "var(--ink)" : "color-mix(in srgb, var(--ink) 15%, transparent)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: reducedMotion ? "none" : "background 150ms ease",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "block",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "var(--surface)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: reducedMotion ? "none" : "transform 150ms ease",
          boxShadow: "0 1px 3px color-mix(in srgb, var(--ink) 15%, transparent)",
        }}
      />
    </button>
  );
}

function ReminderIconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "color-mix(in srgb, var(--ink) 8%, transparent)",
      }}
    >
      <Icon size={15} stroke="var(--ink)" aria-hidden />
    </div>
  );
}

function ReminderTypeRow({
  icon,
  label,
  description,
  checked,
  onChange,
  reducedMotion,
  disabled,
  trailing,
  className,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  reducedMotion?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-2 flex items-center gap-2.5 ${className ?? ""}`}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        background: "color-mix(in srgb, var(--ink) 4%, transparent)",
      }}
    >
      <ReminderIconTile icon={icon} />
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "2px 0 0", lineHeight: 1.35 }}>
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        <ToggleSwitch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          reducedMotion={reducedMotion}
          ariaLabel={label}
        />
      </div>
    </div>
  );
}

function ReminderChannelRow({
  icon,
  label,
  checked,
  onChange,
  reducedMotion,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  reducedMotion?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className="mb-2 flex items-center gap-2.5"
      style={{
        padding: "9px 12px",
        borderRadius: 12,
        background: "color-mix(in srgb, var(--ink) 4%, transparent)",
      }}
    >
      <ReminderIconTile icon={icon} />
      <span className="min-w-0 flex-1" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>
        {label}
      </span>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        reducedMotion={reducedMotion}
        ariaLabel={label}
      />
    </div>
  );
}
