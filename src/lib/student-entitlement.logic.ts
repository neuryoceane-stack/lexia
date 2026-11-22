import { FREEMIUM_PERSONAL_WORD_LIMIT } from "@/lib/offer";
import type {
  StudentEntitlement,
  UnlimitedReason,
} from "@/lib/student-entitlement-types";

export function computeFreemiumCounts(personalWordTotal: number): {
  activeWordCount: number;
  lockedWordCount: number;
  remainingSlots: number;
} {
  const limit = FREEMIUM_PERSONAL_WORD_LIMIT;
  return {
    activeWordCount: Math.min(personalWordTotal, limit),
    lockedWordCount: Math.max(0, personalWordTotal - limit),
    remainingSlots: Math.max(0, limit - personalWordTotal),
  };
}

function unlimitedFreemiumEntitlement(
  personalWordTotal: number,
  unlimitedReason: UnlimitedReason
): StudentEntitlement {
  const limit = FREEMIUM_PERSONAL_WORD_LIMIT;
  return {
    freemiumActive: true,
    unlimited: true,
    unlimitedReason,
    personalWordTotal,
    activeWordCount: personalWordTotal,
    lockedWordCount: 0,
    remainingSlots: limit,
    limit,
  };
}

/** Assemble l'entitlement à partir des faits déjà chargés (testable). */
export function buildStudentEntitlement(
  freemiumActive: boolean,
  unlimited: boolean,
  unlimitedReason: UnlimitedReason,
  personalWordTotal: number
): StudentEntitlement {
  const limit = FREEMIUM_PERSONAL_WORD_LIMIT;
  if (!freemiumActive) {
    return {
      freemiumActive: false,
      unlimited: true,
      unlimitedReason,
      personalWordTotal: 0,
      activeWordCount: 0,
      lockedWordCount: 0,
      remainingSlots: limit,
      limit,
    };
  }
  if (unlimited) {
    return unlimitedFreemiumEntitlement(personalWordTotal, unlimitedReason);
  }
  const counts = computeFreemiumCounts(personalWordTotal);
  return {
    freemiumActive: true,
    unlimited: false,
    unlimitedReason: null,
    personalWordTotal,
    activeWordCount: counts.activeWordCount,
    lockedWordCount: counts.lockedWordCount,
    remainingSlots: counts.remainingSlots,
    limit,
  };
}

export function freemiumBulkImportMessage(
  inserted: number,
  skipped: number,
  remainingSlots: number
): string | undefined {
  if (skipped <= 0) return undefined;
  const rest =
    remainingSlots > 0
      ? ` Il te reste ${remainingSlots} place${remainingSlots > 1 ? "s" : ""}.`
      : "";
  return `${inserted} mot${inserted > 1 ? "s" : ""} ajouté${inserted > 1 ? "s" : ""}. ${skipped} mot${skipped > 1 ? "s" : ""} n'${skipped > 1 ? "ont" : "a"} pas été ajouté${skipped > 1 ? "s" : ""} (limite gratuite).${rest} Abonne-toi pour tout débloquer.`;
}