"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  classId: string;
};

/**
 * Menu ⋮ : actions sans recouvrir les liens du footer de la carte.
 */
export function ClasseCardMenu({ classId }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu de la classe"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="cursor-pointer border-0 bg-transparent p-0 leading-none"
        style={{ fontSize: 18, color: "var(--foreground-muted)" }}
      >
        ⋮
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[168px] rounded-[10px] border py-1 shadow-md"
          style={{
            background: "var(--background-card)",
            borderColor: "var(--border)",
          }}
        >
          <Link
            role="menuitem"
            href={`/app/professeur/classes/${classId}`}
            className="block px-3 py-2 text-[12px] font-medium no-underline hover:bg-[var(--hover-bg)]"
            style={{ color: "var(--foreground)" }}
            onClick={() => setOpen(false)}
          >
            Gérer la classe
          </Link>
          <Link
            role="menuitem"
            href={`/app/professeur/classes/${classId}/progression`}
            className="block px-3 py-2 text-[12px] font-medium no-underline hover:bg-[var(--hover-bg)]"
            style={{ color: "var(--foreground)" }}
            onClick={() => setOpen(false)}
          >
            Voir la progression
          </Link>
        </div>
      )}
    </div>
  );
}
