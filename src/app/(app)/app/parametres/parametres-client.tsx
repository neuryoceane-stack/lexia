"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  Minus,
  Plus,
  User,
  Sprout,
  Flame,
  Gem,
  Check,
  GraduationCap,
  Clock,
  Calendar,
  Zap,
  Activity,
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

type AvatarType = "arbre" | "phenix" | "koala";

/** Illustrations d’avatar : exception D2b, glyphes et teintes inchangés. */
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

const WEEKLY_GOAL_MIN = 5;
const WEEKLY_GOAL_MAX = 70;
const WEEKLY_GOAL_STEP = 5;

const GOAL_PRESETS = [
  { value: 10, label: "Découverte" },
  { value: 20, label: "Régulier" },
  { value: 35, label: "Soutenu" },
  { value: 50, label: "Intensif" },
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

const TOC = [
  { id: "avatar", label: "Avatar" },
  { id: "objectif", label: "Objectif hebdomadaire" },
  { id: "rappels", label: "Rappels" },
  { id: "son", label: "Son" },
  { id: "ma-classe", label: "Ma classe" },
] as const;

function snapWeeklyGoal(n: number): number {
  const s = Math.round(n / WEEKLY_GOAL_STEP) * WEEKLY_GOAL_STEP;
  return Math.min(WEEKLY_GOAL_MAX, Math.max(WEEKLY_GOAL_MIN, s));
}

const cardClass = "scroll-mt-24 rounded-[20px] border-[1.5px] border-line bg-surface p-5";

export function ParametresClient() {
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
  const [activeId, setActiveId] = useState<(typeof TOC)[number]["id"]>("avatar");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const nodes = TOC.map((item) => document.getElementById(item.id)).filter(
      (node): node is HTMLElement => node instanceof HTMLElement
    );
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.id;
        if (id && TOC.some((item) => item.id === id)) {
          setActiveId(id as (typeof TOC)[number]["id"]);
        }
      },
      { rootMargin: "-96px 0px -50% 0px", threshold: [0.1, 0.25, 0.5] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

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
        const g = typeof d.weeklyGoal === "number" ? d.weeklyGoal : 20;
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

  const sliderFillPct =
    ((weeklyGoal - WEEKLY_GOAL_MIN) / (WEEKLY_GOAL_MAX - WEEKLY_GOAL_MIN)) * 100;
  const todayDow = new Date().getDay();
  const wordsPerDay = Math.ceil(weeklyGoal / 7);
  const minutesPerDay = Math.ceil((weeklyGoal / 7) * 1.5);
  const wordsPerYear = (weeklyGoal * 52).toLocaleString("fr-FR");

  return (
    <div>
      <style>{`
        .lexiva-weekly-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 44px;
          background: transparent;
          margin: 0;
          cursor: pointer;
        }
        .lexiva-weekly-range:focus {
          outline: none;
        }
        .lexiva-weekly-range:focus-visible {
          outline: 2px solid var(--ink);
          outline-offset: 2px;
          border-radius: 999px;
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
          background: var(--surface);
          border: 2.5px solid var(--ink);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--ink) 25%, transparent);
        }
        .lexiva-weekly-range::-moz-range-track {
          height: 8px;
          background: transparent;
        }
        .lexiva-weekly-range::-moz-range-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--surface);
          border: 2.5px solid var(--ink);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--ink) 25%, transparent);
        }
        .lexiva-goal-input::-webkit-outer-spin-button,
        .lexiva-goal-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .lexiva-goal-input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>

      <header className="mb-8">
        <h1 className="m-0 text-[46px] leading-[1.05] tracking-[-0.02em] text-ink">Paramètres</h1>
        <p className="mt-2 text-base text-muted">Personnalisez votre expérience.</p>
      </header>

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <nav className="top-24 hidden lg:sticky lg:block lg:self-start" aria-label="Sommaire">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {TOC.map((item) => {
              const active = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={active ? "location" : undefined}
                    onClick={() => setActiveId(item.id)}
                    className="flex min-h-11 items-center rounded-lg px-1 text-[15px] font-medium text-ink no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    <span className={active ? "marker" : undefined} style={{ padding: active ? undefined : "0 7px" }}>
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <section id="avatar" className={`${cardClass} lg:col-span-2`}>
            <SectionHeader
              icon={User}
              title="Avatar"
              subtitle="Choisissez votre avatar — il évolue avec votre niveau d'activité."
            />
            {!loaded ? (
              <p className="m-0 text-sm text-muted">Chargement…</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.map(({ value, label, subLabel, icon: Icon, color }) => {
                  const selected = avatarType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => saveAvatarType(value)}
                      disabled={saving}
                      aria-pressed={selected}
                      className={`relative flex min-h-[120px] flex-col items-center justify-center rounded-2xl bg-surface px-2 py-4 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60 ${
                        selected ? "border-2 border-ink" : "border-[1.5px] border-line hover:border-ink"
                      }`}
                    >
                      {selected ? (
                        <span
                          aria-hidden
                          className="absolute right-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full"
                          style={{ background: "var(--just-sign)" }}
                        >
                          <Check size={14} strokeWidth={3} color="var(--surface)" />
                        </span>
                      ) : null}
                      <Icon size={28} stroke={color} aria-hidden />
                      <span className="mt-2 text-[13px] font-medium text-ink">{label}</span>
                      <span className="mt-0.5 text-[11px] leading-tight text-muted">{subLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section id="objectif" className={`${cardClass} lg:col-span-2`}>
            {!goalLoaded ? (
              <p className="m-0 text-sm text-muted">Chargement…</p>
            ) : (
              <>
                <div className="mb-5 flex flex-col gap-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-surface">
                        <Clock size={16} strokeWidth={1.75} color="var(--ink)" aria-hidden />
                      </span>
                      <h2 className="m-0 min-w-0 text-xl leading-tight text-ink">
                        Objectif hebdomadaire
                      </h2>
                    </div>
                    <span className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-full border-[1.5px] border-line px-3 py-1.5 text-center text-[13px] font-medium text-ink lg:w-auto lg:shrink-0 lg:justify-start">
                      Actuel : {weeklyGoal} mots / sem.
                    </span>
                  </div>
                  <p className="m-0 w-full text-sm leading-snug text-muted">
                    Combien de mots voulez-vous maîtriser cette semaine ?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-medium text-ink">
                      Votre objectif : saisissez le nombre de votre choix
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        aria-label="Diminuer l'objectif"
                        disabled={weeklyGoal <= WEEKLY_GOAL_MIN}
                        onClick={() =>
                          setWeeklyGoal((current) => snapWeeklyGoal(current - WEEKLY_GOAL_STEP))
                        }
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-surface text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus size={18} aria-hidden />
                      </button>
                      <input
                        type="number"
                        className="lexiva-goal-input w-[112px] shrink-0 rounded-2xl border-[1.5px] border-line bg-surface text-center text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
                        style={{
                          height: 76,
                          fontFamily: "var(--font-heading)",
                          fontWeight: 700,
                          fontSize: 40,
                          letterSpacing: "-0.03em",
                        }}
                        min={WEEKLY_GOAL_MIN}
                        max={WEEKLY_GOAL_MAX}
                        step={WEEKLY_GOAL_STEP}
                        value={weeklyGoal}
                        aria-label="Nombre de mots par semaine"
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isNaN(n)) return;
                          setWeeklyGoal(snapWeeklyGoal(n));
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Augmenter l'objectif"
                        disabled={weeklyGoal >= WEEKLY_GOAL_MAX}
                        onClick={() =>
                          setWeeklyGoal((current) => snapWeeklyGoal(current + WEEKLY_GOAL_STEP))
                        }
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-surface text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={18} aria-hidden />
                      </button>
                      <span className="text-sm text-muted">mots par semaine</span>
                    </div>

                    <p className="mb-2 mt-5 text-[13px] text-muted">Ou choisissez un préréglage</p>
                    <div className="grid w-full grid-cols-2 gap-2">
                      {GOAL_PRESETS.map((preset) => {
                        const active = weeklyGoal === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setWeeklyGoal(preset.value)}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-2 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
                            style={{
                              background: "var(--surface)",
                              border: active
                                ? "1.5px solid var(--ink)"
                                : "1.5px solid var(--line)",
                            }}
                          >
                            <span className={active ? "marker" : undefined}>
                              {preset.value} · {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative mt-5 flex h-11 items-center">
                      <div
                        className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                        style={{ background: "var(--background-subtle)" }}
                      />
                      <div
                        className="pointer-events-none absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                        style={{
                          width: `${sliderFillPct}%`,
                          background: "var(--ink)",
                          transition: reducedMotion ? "none" : "width 60ms ease",
                        }}
                      />
                      <input
                        type="range"
                        className="lexiva-weekly-range relative z-[1]"
                        min={WEEKLY_GOAL_MIN}
                        max={WEEKLY_GOAL_MAX}
                        step={WEEKLY_GOAL_STEP}
                        value={weeklyGoal}
                        onChange={(e) => setWeeklyGoal(snapWeeklyGoal(Number(e.target.value)))}
                        aria-label="Objectif hebdomadaire en mots"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="m-0 text-sm font-medium text-ink">Avec cet objectif</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { icon: Calendar, value: String(wordsPerDay), unit: "mots par jour" },
                        { icon: Zap, value: `${minutesPerDay} min`, unit: "estimées par jour" },
                        { icon: Activity, value: wordsPerYear, unit: "mots maîtrisés par an" },
                      ].map(({ icon: StatIcon, value, unit }) => (
                        <div
                          key={unit}
                          className="flex flex-col items-center rounded-2xl border-[1.5px] border-line bg-surface px-2 py-3 text-center"
                        >
                          <StatIcon size={18} strokeWidth={1.75} color="var(--ink)" aria-hidden />
                          <p
                            className="m-0 mt-2 text-ink"
                            style={{
                              fontFamily: "var(--font-heading)",
                              fontWeight: 700,
                              fontSize: 22,
                              lineHeight: 1.1,
                            }}
                          >
                            {value}
                          </p>
                          <p className="m-0 mt-1 text-[11px] leading-snug text-muted">{unit}</p>
                        </div>
                      ))}
                    </div>

                    <p className="mb-3 mt-5 text-sm font-medium text-ink">Répartition suggérée</p>
                    <div className="flex h-14 items-end gap-2" aria-hidden>
                      {WEEK_PREVIEW.map(({ label, pct, dow }) => {
                        const isToday = todayDow === dow;
                        const h = Math.max(3, (weeklyGoal / WEEKLY_GOAL_MAX) * 52 * (pct / 20));
                        return (
                          <div key={label} className="flex h-14 min-w-0 flex-1 items-end justify-center">
                            <div
                              className="w-full max-w-10 rounded-t-[5px]"
                              style={{
                                height: h,
                                background: isToday ? "var(--ink)" : "var(--background-subtle)",
                                transition: reducedMotion
                                  ? "none"
                                  : "height 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 flex gap-2">
                      {WEEK_PREVIEW.map(({ label }) => (
                        <span key={label} className="min-w-0 flex-1 text-center text-[11px] text-muted">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
                  <button
                    type="button"
                    onClick={cancelWeeklyGoalDraft}
                    disabled={goalSaving}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface px-5 text-sm font-medium text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={persistWeeklyGoal}
                    disabled={goalSaving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface outline-none hover:bg-ink-hover focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={16} strokeWidth={2.5} color="var(--surface)" aria-hidden />
                    Enregistrer l&apos;objectif
                  </button>
                </div>
              </>
            )}
          </section>

          <section id="rappels" className={cardClass}>
            <SectionHeader
              icon={Bell}
              title="Rappels"
              subtitle="Choisissez quand et comment on vous rappelle de réviser."
            />
            {!remindersLoaded ? (
              <p className="m-0 text-sm text-muted">Chargement…</p>
            ) : (
              <>
                <div className="flex min-h-11 items-center justify-between gap-3">
                  <p className="m-0 text-[15px] font-medium text-ink">Recevoir des rappels</p>
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
                    description="Chaque jour, si vous avez des mots à revoir."
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
                          lang="fr-FR"
                          className="min-h-11 rounded-xl border-[1.5px] border-line bg-surface px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
                        />
                      ) : null
                    }
                  />
                  <ReminderTypeRow
                    icon={Flame}
                    label="Alerte de série"
                    description="Quand votre série est sur le point de sauter."
                    checked={reminders.streakEnabled}
                    onChange={(v) => updateReminders({ streakEnabled: v })}
                    reducedMotion={reducedMotion}
                    disabled={!reminders.enabled}
                  />
                  <ReminderTypeRow
                    icon={TrendingUp}
                    label="Bilan hebdomadaire"
                    description="Un récap de vos progrès chaque semaine."
                    checked={reminders.weeklyRecapEnabled}
                    onChange={(v) => updateReminders({ weeklyRecapEnabled: v })}
                    reducedMotion={reducedMotion}
                    disabled={!reminders.enabled}
                  />

                  <p className="mb-1 mt-4 text-[13px] font-medium text-ink">Canaux</p>
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
          </section>

          <div className="flex flex-col gap-5">
            <section id="son" className={cardClass}>
              <SectionHeader icon={Volume2} title="Son" subtitle="Gère les sons de l'application." />
              {!soundPrefsLoaded ? (
                <p className="m-0 text-sm text-muted">Chargement…</p>
              ) : (
                <ReminderTypeRow
                  icon={Music}
                  label="Sons de feedback"
                  description="Un son quand votre réponse est juste ou fausse, pendant la révision."
                  checked={feedbackSoundsEnabled}
                  onChange={updateFeedbackSounds}
                  reducedMotion={reducedMotion}
                />
              )}
            </section>

            <section id="ma-classe" className={cardClass} aria-disabled="true">
              <div className="mb-4 flex items-start justify-between gap-3">
                <SectionHeader
                  icon={GraduationCap}
                  title="Ma classe"
                  subtitle="Rejoignez une classe avec le code fourni par votre professeur."
                  className="mb-0 min-w-0 flex-1"
                />
                <span className="inline-flex shrink-0 items-center rounded-full bg-mark px-3 py-1 text-[13px] font-medium text-ink">
                  À venir
                </span>
              </div>
              <p id="ma-classe-bientot" className="m-0 mb-4 text-sm leading-relaxed text-ink">
                L&apos;espace professeur n&apos;est pas encore ouvert. Vous pourrez bientôt rejoindre la
                classe de votre professeur ici.
              </p>
              <fieldset disabled className="m-0 min-w-0 border-0 p-0" style={{ opacity: 0.72 }}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    disabled
                    readOnly
                    placeholder="Code de la classe"
                    aria-label="Code de la classe"
                    aria-describedby="ma-classe-bientot"
                    className="min-h-[50px] min-w-0 flex-1 cursor-not-allowed rounded-[14px] border-[1.5px] border-line bg-page px-3.5 text-[15px] text-muted outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full border-[1.5px] border-line bg-page px-5 text-sm font-medium text-muted"
                  >
                    Rejoindre
                  </button>
                </div>
              </fieldset>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? "mb-4"}`}>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-surface">
        <Icon size={16} strokeWidth={1.75} color="var(--ink)" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="m-0 text-xl leading-tight text-ink">{title}</h2>
        {subtitle ? <p className="m-0 mt-1 text-sm leading-snug text-muted">{subtitle}</p> : null}
      </div>
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
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className="inline-flex h-11 w-[52px] shrink-0 items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed"
      style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}
    >
      <span
        aria-hidden
        className="flex h-[26px] w-[46px] items-center rounded-full border-[1.5px] border-ink px-0.5"
        style={{
          boxSizing: "border-box",
          justifyContent: checked ? "flex-end" : "flex-start",
          background: checked ? "var(--ink)" : "var(--surface)",
          transition: reducedMotion ? "none" : "background 150ms ease",
        }}
      >
        <span
          className="block h-[18px] w-[18px] rounded-full"
          style={{ background: checked ? "var(--surface)" : "var(--ink)" }}
        />
      </span>
    </button>
  );
}

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-line bg-surface">
      <Icon size={16} strokeWidth={1.75} color="var(--ink)" aria-hidden />
    </span>
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
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  reducedMotion?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 py-2">
      <RowIcon icon={icon} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[15px] font-medium leading-snug text-ink">{label}</p>
        <p className="m-0 mt-0.5 text-[13px] leading-snug text-muted">{description}</p>
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
    <div className="flex min-h-11 items-center gap-3 py-1.5">
      <RowIcon icon={icon} />
      <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">{label}</span>
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
