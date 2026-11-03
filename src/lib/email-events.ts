import "server-only";

import { db } from "@/lib/db";
import { emailEvents, type EmailEventType } from "@/lib/db/schema";
import { sanitizeErrorMessage, isMissingTechHealthTable } from "@/lib/error-event-utils";

const ERROR_MAX = 300;

export type { EmailEventType };

function sanitizeEmailError(raw: string): string {
  const cleaned = sanitizeErrorMessage(raw);
  return cleaned.length > ERROR_MAX ? cleaned.slice(0, ERROR_MAX) : cleaned;
}

export type RecordEmailEventInput = {
  toEmail: string;
  type: EmailEventType;
  status: "sent" | "failed";
  error?: string | null;
  providerId?: string | null;
  userId?: string | null;
};

export async function recordEmailEvent(input: RecordEmailEventInput): Promise<void> {
  try {
    const toEmail = input.toEmail.trim().toLowerCase().slice(0, 320);
    if (!toEmail) return;

    await db.insert(emailEvents).values({
      id: crypto.randomUUID(),
      toEmail,
      type: input.type,
      status: input.status,
      error: input.error ? sanitizeEmailError(input.error) : null,
      providerId: input.providerId ?? null,
      userId: input.userId ?? null,
      createdAt: new Date(),
    });
  } catch (error) {
    if (isMissingTechHealthTable(error)) return;
  }
}

export function logEmailEvent(input: RecordEmailEventInput): void {
  void recordEmailEvent(input).catch(() => {});
}
