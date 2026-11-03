import { FEEDBACK_TYPES, type FeedbackFormType } from "./feedback-form";
import type { FeedbackDeviceClass } from "./feedback-context";

export const FEEDBACK_DEVICE_VALUES = ["mobile", "tablette", "ordinateur"] as const;
export type FeedbackDevice = (typeof FEEDBACK_DEVICE_VALUES)[number];

export function parseFeedbackDevice(value: unknown): FeedbackDevice | null {
  if (typeof value !== "string") return null;
  return FEEDBACK_DEVICE_VALUES.includes(value as FeedbackDevice)
    ? (value as FeedbackDevice)
    : null;
}

export function isMissingFeedbackMetaTable(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${text} ${cause}`;
  return /no such table/i.test(combined) && /feedback_meta/i.test(combined);
}

export function normalizeFeedbackBrowser(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 80);
  return trimmed || null;
}

export type FeedbackMetaPayload = {
  type: FeedbackFormType;
  page: string | null;
  device: FeedbackDevice;
  browser: string | null;
};

export function parseFeedbackMetaPayload(body: {
  type?: unknown;
  page?: unknown;
  device?: unknown;
  browser?: unknown;
}): FeedbackMetaPayload | null {
  const type =
    typeof body.type === "string" &&
    FEEDBACK_TYPES.includes(body.type as FeedbackFormType)
      ? (body.type as FeedbackFormType)
      : null;
  const device = parseFeedbackDevice(body.device);
  if (!type || !device) return null;

  const pageRaw = typeof body.page === "string" ? body.page.trim().slice(0, 500) : "";
  const page = pageRaw || null;
  const browser = normalizeFeedbackBrowser(body.browser);

  return { type, page, device, browser };
}

export function deviceLabel(device: FeedbackDevice): string {
  if (device === "mobile") return "Mobile";
  if (device === "tablette") return "Tablette";
  return "Ordinateur";
}
