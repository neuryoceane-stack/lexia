import type { LucideIcon } from "lucide-react";

type EmptyMarkSize = 96 | 140;

type EmptyMarkProps = {
  icon: LucideIcon;
  /** 96 px dans les états vides, 140 px sur la page 404. */
  size?: EmptyMarkSize;
  className?: string;
};

const ICON_SIZE: Record<EmptyMarkSize, number> = {
  96: 40,
  140: 56,
};

/** Pastille ronde des états sans mascotte : fond marqueur, trait encre. */
export function EmptyMark({ icon: Icon, size = 96, className }: EmptyMarkProps) {
  return (
    <span
      aria-hidden
      className={["inline-flex shrink-0 items-center justify-center rounded-full", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: size,
        height: size,
        background: "var(--mark)",
      }}
    >
      <Icon size={ICON_SIZE[size]} strokeWidth={1.8} color="var(--ink)" aria-hidden />
    </span>
  );
}
