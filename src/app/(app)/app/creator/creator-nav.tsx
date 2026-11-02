"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  CREATOR_SECTIONS,
  creatorHref,
  type CreatorSectionId,
} from "./creator-sections";

function NavLink({
  id,
  label,
  active,
}: {
  id: CreatorSectionId;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={creatorHref(id)}
      aria-current={active ? "page" : undefined}
      className="group flex h-11 shrink-0 items-center rounded-lg px-1 text-[15px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 md:w-full"
    >
      <span
        className={
          active
            ? "marker whitespace-nowrap font-medium"
            : "whitespace-nowrap px-[7px] text-muted transition-colors group-hover:text-ink"
        }
      >
        {label}
      </span>
    </Link>
  );
}

export function CreatorNav({ section }: { section: CreatorSectionId }) {
  const scrollerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const current = scroller?.querySelector<HTMLElement>("[aria-current='page']");
    if (!scroller || !current) return;
    const left = current.offsetLeft - scroller.clientWidth / 2 + current.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, left) });
  }, [section]);

  return (
    <div className="min-w-0 md:sticky md:top-[88px] md:w-[220px] md:self-start">
      <nav
        ref={scrollerRef}
        className="sticky top-[72px] z-10 mb-6 flex gap-1 overflow-x-auto bg-page py-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
        aria-label="Sections de l'espace créateur"
      >
        {CREATOR_SECTIONS.map((item) => (
          <NavLink key={item.id} id={item.id} label={item.label} active={item.id === section} />
        ))}
      </nav>
      <nav className="hidden md:block" aria-label="Sections de l'espace créateur">
        <div className="flex flex-col">
          {CREATOR_SECTIONS.map((item) => (
            <NavLink key={item.id} id={item.id} label={item.label} active={item.id === section} />
          ))}
        </div>
      </nav>
    </div>
  );
}
