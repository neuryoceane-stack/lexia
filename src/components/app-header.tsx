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

function AvatarDropdown({
  name,
  isProfesseur,
}: {
  name: string;
  isProfesseur?: boolean;
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
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
            aria-hidden
          />
          <div
            style={{
              position: "fixed",
              top: "60px",
              right: "8px",
              zIndex: 9999,
              width: "280px",
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
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
          <a
            href="/app/parametres/information-personnelle"
            onClick={() => setOpen(false)}
            style={{ cursor: "pointer", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-vocab-gray transition hover:bg-primary/10 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/10 dark:hover:text-primary-light"
          >
            <span className="text-base" aria-hidden>👤</span>
            <span>Informations personnelles</span>
          </a>
          <a
            href="/app/parametres"
            onClick={() => setOpen(false)}
            style={{ cursor: "pointer", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-vocab-gray transition hover:bg-primary/10 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/10 dark:hover:text-primary-light"
          >
            <span className="text-base" aria-hidden>⚙️</span>
            <span>Paramètres</span>
          </a>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-slate-200 dark:bg-slate-700" />

        {/* Déconnexion */}
        <div className="p-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void handleLogout();
            }}
            style={{ cursor: "pointer", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <span className="text-base" aria-hidden>🔴</span>
            <span>Déconnexion</span>
          </button>
        </div>
          </div>
        </>
      )}
    </div>
  );
}

const navItemCreator = { href: "/app/creator", label: "Créateur", icon: "bolt" as const } as const;

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
            <AvatarDropdown name={displayName} isProfesseur={isProfesseur} />
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

      {/* Mobile drawer — navigation uniquement */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[9997] md:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Overlay sombre — ferme au clic */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        {/* Drawer slide-in depuis la droite (300ms) */}
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: "280px",
            backgroundColor: "white",
            zIndex: 9998,
            boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 300ms ease",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header : logo Lexiva + LEXIVA + croix fermeture */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
            <Link
              href={homeHref}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 no-underline"
            >
              <Image src="/logo.png" alt="" width={32} height={32} />
              <span className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
                LEXIVA
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="btn-relief rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Fermer le menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Navigation */}
          <nav style={{ padding: "16px 0" }} aria-label="Navigation mobile">
            {[
              { href: "/app/familles", label: "Bibliothèque", icon: "📚" },
              { href: "/app/revision", label: "Évaluation", icon: "⚡" },
              { href: "/app/jardin", label: "Synthèse", icon: "📊" },
              ...(isCreator ? [{ href: "/app/creator", label: "Créateur", icon: "⚡" }] : []),
            ].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 24px",
                  fontSize: "16px",
                  fontWeight: "500",
                  color: isActive ? "white" : undefined,
                  background: isActive ? "#6C3FC8" : "transparent",
                  textDecoration: "none",
                }}
                className={!isActive ? "text-slate-800 dark:text-slate-200" : ""}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
