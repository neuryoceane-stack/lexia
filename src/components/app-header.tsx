"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsBell } from "@/components/notifications-bell";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

const navItemsStudent = [
  { href: "/app/familles", label: "Bibliothèque", icon: "book" as const },
  { href: "/app/revision", label: "Évaluation", icon: "clipboard" as const },
  { href: "/app/jardin", label: "Synthèse", icon: "sparkles" as const },
] as const;

const navItemsProfesseur = [
  { href: "/app/professeur", label: "Accueil", icon: "home" as const },
  { href: "/app/professeur/classes", label: "Mes classes", icon: "users" as const },
  { href: "/app/familles", label: "Ma bibliothèque", icon: "book" as const },
] as const;


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

function IconSettings({ className }: { className?: string } = {}) {
  return (
    <svg className={className ?? iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconUser({ className }: { className?: string } = {}) {
  return (
    <svg className={className ?? iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string } = {}) {
  return (
    <svg className={className ?? iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string } = {}) {
  return (
    <svg className={className ?? iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = () => setIsMobile(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

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
      {/* Overlay mobile — visible uniquement quand dropdown ouvert sur mobile */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      {open && (
        <div
          className="fixed right-2 top-[56px] z-[9999] w-[calc(100vw-16px)] max-w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0F0E1A] md:absolute md:right-0 md:top-full md:mt-2 md:w-56 md:max-w-none md:max-h-none"
          style={{ backgroundColor: "white", ...(isMobile ? { position: "fixed" as const } : {}) }}
        >
        {/* Carte de profil */}
        <div className="rounded-t-2xl bg-[#6C3FC8]/5 p-4 dark:bg-[#6C3FC8]/10" style={{ backgroundColor: "rgba(108, 63, 200, 0.05)" }}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full bg-[#6C3FC8] text-base font-semibold text-white"
              aria-hidden
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-vocab-gray dark:text-slate-100">
                {name}
              </p>
              <p className="text-xs text-slate-400">
                {isProfesseur ? "Professeur" : "Élève"}
              </p>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        {/* Paramètres et Profil */}
        <div className="space-y-0.5 px-2 py-2">
          <Link
            href="/app/parametres/information-personnelle"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-vocab-gray transition hover:bg-primary/10 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/10 dark:hover:text-primary-light"
          >
            <span className="text-base" aria-hidden>👤</span>
            <span>Informations personnelles</span>
          </Link>
          <Link
            href="/app/parametres"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-vocab-gray transition hover:bg-primary/10 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/10 dark:hover:text-primary-light"
          >
            <span className="text-base" aria-hidden>⚙️</span>
            <span>Paramètres</span>
          </Link>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        {/* Déconnexion */}
        <div className="p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <IconLogout className="h-4 w-4 flex-shrink-0 text-current" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

const navItemCreator = { href: "/app/creator", label: "Créateur", icon: "bolt" as const } as const;

function NavIcon({ type }: { type: string }) {
  const iconClass = "h-5 w-5 flex-shrink-0";
  switch (type) {
    case "book":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case "home":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "users":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "bolt":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return null;
  }
}

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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);
  const displayName = user?.name || user?.email?.split("@")[0] || "Utilisateur";
  const baseNavItems = isProfesseur ? navItemsProfesseur : navItemsStudent;
  const navItems = isCreator ? [...baseNavItems, navItemCreator] : baseNavItems;
  const homeHref = isProfesseur ? "/app/professeur" : "/app";

  return (
    <>
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
      <div className="mx-auto flex h-14 max-w-[1200px] flex-row items-center justify-between px-4 sm:px-6">
        {/* Logo + nom — gauche */}
        <div className="flex flex-shrink-0 flex-row items-center">
          <Link
            href={homeHref}
            className="relative inline-flex flex-row items-center gap-2.5 pb-1 text-vocab-gray no-underline outline-none transition hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-slate-100 dark:hover:text-primary-light"
            aria-label="LEXIVA — Accueil"
          >
            <span className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Lexiva"
                width={40}
                height={40}
                style={{ objectFit: "contain", minWidth: "40px" }}
              />
            </span>
            <span className="text-lg font-semibold">LEXIVA</span>
            <span className="absolute bottom-0 right-0 text-[10px] italic leading-none text-slate-400 dark:text-slate-500">
              {isProfesseur ? "teacher" : "student"}
            </span>
          </Link>
        </div>

        {/* Desktop nav — centre */}
        <nav
          className="hidden flex-1 flex-row items-center justify-center gap-1 md:flex"
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
        <div className="flex flex-shrink-0 flex-row items-center gap-3">
          <div className="hidden md:block">
            <NotificationsBell />
          </div>
          <div className="relative">
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

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-50 md:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        {/* Drawer panel — slide-in from right */}
        <div
          className={`absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-[#0F0E1A] ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header : LEXIVA + rôle (pas de logo pour éviter le doublon) */}
          <div className="flex flex-shrink-0 items-center border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
            <Link
              href={homeHref}
              onClick={() => setMobileOpen(false)}
              className="no-underline"
            >
              <span className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
                LEXIVA
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCreator ? "creator" : isProfesseur ? "teacher" : "student"}
              </p>
            </Link>
          </div>
          {/* Avatar + nom */}
          <div className="flex items-center gap-3 px-4 py-4">
            <Avatar name={displayName} className="h-11 w-11 text-base" />
            <span className="truncate font-medium text-vocab-gray dark:text-slate-100">
              {displayName}
            </span>
          </div>
          <div className="h-px flex-shrink-0 bg-slate-200 dark:bg-slate-700" />
          {/* Navigation */}
          <nav className="flex flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Navigation mobile">
            {navItems.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                    : "text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <NavIcon type={icon} />
                {label}
              </Link>
            ))}
          </nav>
          {!isProfesseur && (
            <>
              <div className="h-px flex-shrink-0 bg-slate-200 dark:bg-slate-700" />
              <div className="px-2 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setJoinModalOpen(true);
                  }}
                  className="btn-relief flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <IconUsers />
                  Rejoindre une classe
                </button>
              </div>
            </>
          )}
          <div className="flex-1" />
          <div className="h-px flex-shrink-0 bg-slate-200 dark:bg-slate-700" />
          {/* Déconnexion — rouge en bas */}
          <div className="flex flex-shrink-0 p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <IconLogout className="h-4 w-4 flex-shrink-0 text-current" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </header>
    <JoinClassModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </>
  );
}
