import type { ReactNode } from "react";

type ARemplirProps = {
  children: ReactNode;
};

export function ARemplir({ children }: ARemplirProps) {
  return (
    <mark className="rounded px-1.5 py-0.5 font-medium text-ink bg-mark">
      【À COMPLÉTER : {children}】
    </mark>
  );
}
