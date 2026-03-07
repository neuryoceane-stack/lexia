"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsBell } from "@/components/notifications-bell";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

const navItemsStudent = [
  { href: "/app/familles", label: "Bibliothèque" },
  { href: "/app/revision", label: "Évaluation" },
  { href: "/app/jardin", label: "Synthèse" },
] as const;

const navItemsProfesseur = [
  { href: "/app/professeur", label: "Accueil" },
  { href: "/app/professeur/classes", label: "Mes classes" },
  { href: "/app/familles", label: "Ma bibliothèque" },
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

function JoinClassModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const id = identifier.trim().toUpperCase();
    if (!id) {
      setMessage({ type: "error", text: "Identifiant requis" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: data.message ?? "Demande envoyée." });
        setIdentifier("");
      } else {
        setMessage({ type: "error", text: data.error ?? "Erreur" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-class-title"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="join-class-title" className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
            Rejoindre une classe
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-relief rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="class-identifier" className="block text-sm font-medium text-vocab-gray dark:text-slate-200">
              Identifiant de la classe
            </label>
            <input
              id="class-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
              placeholder="Ex. ABC123"
              maxLength={6}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          {message && (
            <p
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Rejoindre"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-relief rounded-lg px-4 py-2 text-sm font-medium text-vocab-gray"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const iconClass =
  "h-4 w-4 flex-shrink-0 text-slate-400 transition-colors group-hover:text-primary dark:text-slate-500 dark:group-hover:text-primary-light";

function IconSettings() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

const dropdownItemClass =
  "group btn-relief flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-vocab-gray transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/80";

function AvatarDropdown({
  name,
  isProfesseur,
  onJoinClass,
}: {
  name: string;
  isProfesseur?: boolean;
  onJoinClass?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const initials = name
    ? name
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`btn-relief flex rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          open ? "ring-2 ring-primary/30 ring-offset-2 dark:ring-primary-light/30" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menu compte"
      >
        <Avatar name={name} />
      </button>
      <div
        className={`absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-xl border border-slate-200/90 bg-white shadow-xl transition-all duration-200 ease-out dark:border-slate-700/80 dark:bg-slate-800 ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* En-tête */}
        <div className="rounded-t-xl bg-slate-50/80 px-4 py-3 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-base font-semibold text-primary dark:from-primary/30 dark:to-primary/10 dark:text-primary-light">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-vocab-gray dark:text-slate-100">{name}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isProfesseur ? "Professeur" : "Élève"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="py-2">
          {!isProfesseur && onJoinClass && (
            <div className="px-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onJoinClass();
                }}
                className={dropdownItemClass}
              >
                <IconUsers />
                <div className="min-w-0 flex-1 text-left">
                  <span className="block">Rejoindre une classe</span>
                  <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                    Code fourni par le professeur
                  </span>
                </div>
              </button>
            </div>
          )}
          <div className="mt-1 space-y-2 px-2">
            <p className="mb-1 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Mon compte
            </p>
            <Link href="/app/parametres" onClick={() => setOpen(false)} className={dropdownItemClass}>
              <IconSettings />
              <span>Paramètres</span>
            </Link>
            <Link
              href="/app/parametres/information-personnelle"
              onClick={() => setOpen(false)}
              className={dropdownItemClass}
            >
              <IconUser />
              <span>Profil</span>
            </Link>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="border-t border-slate-100 px-2 py-2 dark:border-slate-700/80">
          <button
            type="button"
            onClick={handleLogout}
            className={`${dropdownItemClass} w-full text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400`}
          >
            <IconLogout />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const navItemCreator = { href: "/app/creator", label: "⚡" } as const;

export function AppHeader({
  user,
  isProfesseur = false,
  isCreator = false,
}: {
  user: { name?: string | null; email?: string | null };
  isProfesseur?: boolean;
  isCreator?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const displayName = user?.name || user?.email?.split("@")[0] || "Utilisateur";
  const baseNavItems = isProfesseur ? navItemsProfesseur : navItemsStudent;
  const navItems = isCreator ? [...baseNavItems, navItemCreator] : baseNavItems;
  const homeHref = isProfesseur ? "/app/professeur" : "/app";

  return (
    <>
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        {/* Logo + nom */}
        <Link
          href={homeHref}
          className="relative inline-flex pb-1 text-vocab-gray no-underline outline-none transition hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-slate-100 dark:hover:text-primary-light"
          aria-label="LEXIVA — Accueil"
        >
          <span className="flex items-center gap-2.5">
            <LogoIcon className="h-6 w-6 text-primary dark:text-primary-light" />
            <span className="text-lg font-semibold">LEXIVA</span>
          </span>
          <span className="absolute bottom-0 right-0 text-[10px] italic leading-none text-slate-400 dark:text-slate-500">
            {isProfesseur ? "teacher" : "student"}
          </span>
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
              className={`btn-relief rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-primary dark:text-primary-light"
                  : "text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: notifications + avatar + burger */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <NotificationsBell />
          </div>
          <div className="relative hidden md:block">
            <AvatarDropdown
              name={displayName}
              isProfesseur={isProfesseur}
              onJoinClass={!isProfesseur ? () => setJoinModalOpen(true) : undefined}
            />
          </div>

          <div className="md:hidden">
            <NotificationsBell />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="btn-relief flex h-9 w-9 items-center justify-center rounded-lg text-vocab-gray hover:bg-slate-100 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-primary-light"
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
              className={`btn-relief rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
          {!isProfesseur && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setJoinModalOpen(true);
              }}
              className="btn-relief mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Rejoindre une classe
            </button>
          )}
          <Link
            href="/app/parametres"
            onClick={() => setMobileOpen(false)}
            className="btn-relief mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Paramètres
          </Link>
          <Link
            href="/app/parametres/information-personnelle"
            onClick={() => setMobileOpen(false)}
            className="btn-relief mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Profil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-relief mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
    <JoinClassModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </>
  );
}
