"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/app/familles", label: "Bibliothèque" },
  { href: "/app/revision", label: "Évaluation" },
  { href: "/app/jardin", label: "Synthèse" },
] as const;

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    ? name
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <span
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary dark:bg-primary/20 dark:text-primary-light ${className ?? ""}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function AvatarDropdown({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menu compte"
      >
        <Avatar name={name} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <p className="truncate px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{name}</p>
          <Link
            href="/app/parametres"
            className="block w-full px-3 py-2 text-left text-sm font-medium text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => setOpen(false)}
          >
            Paramètres
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-3 py-2 text-left text-sm font-medium text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Déconnexion
          </button>
        </div>
      )}
    </>
  );
}

export function AppHeader({ user }: { user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = user?.name || user?.email?.split("@")[0] || "Utilisateur";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        {/* Logo + nom */}
        <Link
          href="/app"
          className="flex items-center gap-2.5 text-vocab-gray no-underline outline-none transition hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-slate-100 dark:hover:text-primary-light"
          aria-label="Vocab Jardin — Accueil"
        >
          <LogoIcon className="h-6 w-6 text-primary dark:text-primary-light" />
          <span className="text-lg font-semibold">Vocab Jardin</span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navigation principale"
        >
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-primary dark:text-primary-light"
                  : "text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: avatar + burger */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <AvatarDropdown name={displayName} />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-vocab-gray hover:bg-slate-100 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-primary-light"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Ouvrir le menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-slate-200/80 transition-all duration-200 md:hidden dark:border-slate-700/80 ${
          mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <nav className="flex flex-col gap-0.5 px-4 py-3" aria-label="Navigation mobile">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                  : "text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3 border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
            <Avatar name={displayName} />
            <span className="text-sm text-slate-600 dark:text-slate-400">{displayName}</span>
          </div>
          <Link
            href="/app/parametres"
            onClick={() => setMobileOpen(false)}
            className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Paramètres
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  );
}
