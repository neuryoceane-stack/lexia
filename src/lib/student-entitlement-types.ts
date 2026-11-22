export type UnlimitedReason =
  | "subscription"
  | "trial"
  | "role"
  | "class_pilot"
  | null;

export type StudentEntitlement = {
  freemiumActive: boolean;
  unlimited: boolean;
  unlimitedReason: UnlimitedReason;
  personalWordTotal: number;
  activeWordCount: number;
  lockedWordCount: number;
  remainingSlots: number;
  limit: number;
};

export type ClientStudentEntitlement = StudentEntitlement & {
  activeWordIds: string[];
};