import { CircleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AuthAlert({
  children,
  icon: Icon = CircleAlert,
  className,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <p role="alert" className={["auth-alert", className].filter(Boolean).join(" ")}>
      <Icon size={18} strokeWidth={1.8} aria-hidden />
      <span>{children}</span>
    </p>
  );
}
