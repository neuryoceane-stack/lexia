import type { ReactNode } from "react";

type ARemplirProps = {
  children: ReactNode;
};

export function ARemplir({ children }: ARemplirProps) {
  return (
    <mark className="rounded px-1.5 py-0.5 font-medium text-[#1A1535] bg-[#FFFF00]">
      【À COMPLÉTER : {children}】
    </mark>
  );
}
