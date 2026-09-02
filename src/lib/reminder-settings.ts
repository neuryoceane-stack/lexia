export type ReminderSettings = {
  enabled: boolean;
  revisionEnabled: boolean;
  revisionTime: string;
  streakEnabled: boolean;
  weeklyRecapEnabled: boolean;
  emailChannel: boolean;
  pushChannel: boolean;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  revisionEnabled: true,
  revisionTime: "18:00",
  streakEnabled: true,
  weeklyRecapEnabled: false,
  emailChannel: true,
  pushChannel: false,
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseReminderSettings(raw: unknown): ReminderSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
  const o = raw as Record<string, unknown>;
  const revisionTime =
    typeof o.revisionTime === "string" && TIME_PATTERN.test(o.revisionTime)
      ? o.revisionTime
      : DEFAULT_REMINDER_SETTINGS.revisionTime;

  return {
    enabled:
      typeof o.enabled === "boolean" ? o.enabled : DEFAULT_REMINDER_SETTINGS.enabled,
    revisionEnabled:
      typeof o.revisionEnabled === "boolean"
        ? o.revisionEnabled
        : DEFAULT_REMINDER_SETTINGS.revisionEnabled,
    revisionTime,
    streakEnabled:
      typeof o.streakEnabled === "boolean"
        ? o.streakEnabled
        : DEFAULT_REMINDER_SETTINGS.streakEnabled,
    weeklyRecapEnabled:
      typeof o.weeklyRecapEnabled === "boolean"
        ? o.weeklyRecapEnabled
        : DEFAULT_REMINDER_SETTINGS.weeklyRecapEnabled,
    emailChannel:
      typeof o.emailChannel === "boolean"
        ? o.emailChannel
        : DEFAULT_REMINDER_SETTINGS.emailChannel,
    pushChannel:
      typeof o.pushChannel === "boolean"
        ? o.pushChannel
        : DEFAULT_REMINDER_SETTINGS.pushChannel,
  };
}

export function parseReminderSettingsJson(json: string | null | undefined): ReminderSettings {
  if (!json) return { ...DEFAULT_REMINDER_SETTINGS };
  try {
    return parseReminderSettings(JSON.parse(json));
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
}
