"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsBell } from "@/components/notifications-bell";
import { Star, User, Settings, LogOut, ChevronRight, ShoppingBag } from "lucide-react";

const LEVEL_NAMES: Record<number, string> = {
  1: "Graine",
  2: "Pousse",
  3: "Explorateur",
  4: "Apprenti",
  5: "Maître",
};
function getLevelName(level: number): string {
  if (level >= 6) return "Légende";
  return LEVEL_NAMES[level] ?? "Graine";
}

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
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary ${className ?? ""}`}
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
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);

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

  useEffect(() => {
    fetch("/api/synthese?period=all")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const entries = Object.values(d.sessionsByDay ?? {}) as Array<{ count?: number }>;
        const sessions = entries.reduce((a, x) => a + (x.count ?? 0), 0);
        const xp = (d.wordsRetained ?? 0) * 5 + sessions * 20 + (d.wordsWritten ?? 0) * 3;
        setUserXP(xp);
        setUserLevel(Math.max(1, Math.min(6, Math.floor(xp / 1000) + 1)));
      })
      .catch(() => {});
  }, []);

  const initial = name ? name.trim()[0]?.toUpperCase() ?? "?" : "?";
  const xpInLevel = userXP % 1000;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 ${
          open ? "ring-2 ring-[#6C3FC8]/30 ring-offset-2" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menu compte"
      >
        <Avatar name={name} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 9999,
            width: 230,
            backgroundColor: "white",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(108,63,200,0.10)",
            border: "0.5px solid rgba(108,63,200,0.15)",
            overflow: "hidden",
          }}
        >
          {/* Header violet */}
          <div
            className="flex items-center gap-3"
            style={{ background: "#6C3FC8", padding: "14px 16px" }}
          >
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.3)",
                color: "white",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p style={{ fontSize: 14, fontWeight: 500, color: "white", marginBottom: 2 }} className="truncate">
                {name}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
                {isProfesseur ? "Professeur" : "Étudiant"}
              </p>
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "2px 8px",
                  borderRadius: 8,
                }}
              >
                <Star size={9} stroke="white" />
                Niveau {userLevel} — {getLevelName(userLevel)}
              </span>
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(xpInLevel / 1000) * 100}%`, background: "white", borderRadius: 2 }} />
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>
                  {xpInLevel} / 1000 XP
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ padding: "6px 0" }}>
            <Link
              href="/app/parametres/information-personnelle"
              onClick={() => setOpen(false)}
              className="flex items-center gap-[10px] no-underline transition"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F0EDF8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: "#F0EDF8" }}>
                <User size={13} stroke="#6C3FC8" />
              </div>
              <span className="flex-1" style={{ fontSize: 13, color: "#1a1a1a" }}>Mon profil</span>
              <ChevronRight size={12} stroke="#a1a1aa" />
            </Link>

            {!isProfesseur && (
              <Link
                href="/app/shop"
                onClick={() => setOpen(false)}
                className="flex items-center gap-[10px] no-underline transition"
                style={{ padding: "10px 16px", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F0EDF8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: "#F0EDF8" }}>
                  <ShoppingBag size={13} stroke="#6C3FC8" />
                </div>
                <span className="flex-1" style={{ fontSize: 13, color: "#1a1a1a" }}>Lexi Shop</span>
                <span
                  style={{
                    background: "#F5A623",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "2px 7px",
                    borderRadius: 10,
                    whiteSpace: "nowrap",
                  }}
                >
                  Bientôt
                </span>
                <ChevronRight size={12} stroke="#a1a1aa" />
              </Link>
            )}

            <Link
              href="/app/parametres"
              onClick={() => setOpen(false)}
              className="flex items-center gap-[10px] no-underline transition"
              style={{ padding: "10px 16px", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F0EDF8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: "#f4f4f5" }}>
                <Settings size={13} stroke="#71717a" />
              </div>
              <span className="flex-1" style={{ fontSize: 13, color: "#1a1a1a" }}>Paramètres</span>
              <ChevronRight size={12} stroke="#a1a1aa" />
            </Link>
          </div>

          {/* Séparateur */}
          <div style={{ borderTop: "0.5px solid #e4e4e7", margin: "4px 0" }} />

          {/* Déconnexion */}
          <div style={{ padding: "6px 0" }}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void handleLogout();
              }}
              className="flex w-full items-center gap-[10px] transition"
              style={{ padding: "10px 16px", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FCEBEB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: "#FCEBEB" }}>
                <LogOut size={13} stroke="#E24B4A" />
              </div>
              <span style={{ fontSize: 13, color: "#E24B4A" }}>Déconnexion</span>
            </button>
          </div>
        </div>
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
  const [burgerMounted, setBurgerMounted] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);

  useEffect(() => {
    setBurgerMounted(true);
  }, []);

  useEffect(() => {
    if (burgerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [burgerOpen]);
  const displayName = user?.name || user?.email?.split("@")[0] || "Utilisateur";
  const baseNavItems = isProfesseur ? navItemsProfesseur : navItemsStudent;
  const navItems = isCreator ? [...baseNavItems, navItemCreator] : baseNavItems;
  const homeHref = isProfesseur ? "/app/professeur" : "/app";

  function isNavActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      className="sticky top-0 z-20 border-b border-[#E2DCF5]/90 bg-white/95 backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgba(108, 63, 200, 0.04)" }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 sm:gap-10 sm:px-6">
        {/* Logo — gauche */}
        <Link
          href={homeHref}
          className="inline-flex shrink-0 items-center gap-3 no-underline outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2"
          aria-label="Lexiva — Accueil"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          <Image
            src="/logo-mark.png"
            alt=""
            width={36}
            height={36}
            style={{ objectFit: "contain" }}
            priority
          />
          <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#1A1033]">
            Lexiva
          </span>
        </Link>

        {/* Navigation — liens texte (desktop) */}
        <nav
          className="hidden flex-1 items-center gap-8 md:flex"
          aria-label="Navigation principale"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          {navItems.map(({ href, label }) => {
            const active = isNavActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative py-1 text-[14px] font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2"
                style={{
                  color: active ? "#6C3FC8" : "#7C6FA3",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "#6C3FC8";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#7C6FA3";
                }}
              >
                {label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 right-0 mx-auto h-0.5 rounded-full"
                    style={{ background: "#6C3FC8", maxWidth: "100%" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 md:hidden" aria-hidden />

        {/* Droite : notifications + avatar + menu mobile */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <NotificationsBell />
          <AvatarDropdown name={displayName} isProfesseur={isProfesseur} />
          <button
            type="button"
            onClick={() => setBurgerOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7C6FA3] transition-colors hover:bg-[#F0EDF8] hover:text-[#6C3FC8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 md:hidden"
            aria-expanded={burgerOpen}
            aria-controls="mobile-menu"
            aria-label={burgerOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {burgerOpen ? (
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

      {/* Menu mobile */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[9997] md:hidden ${
          burgerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!burgerOpen}
      >
        {burgerMounted && burgerOpen && (
          <>
            <div
              className="absolute inset-0 bg-black/40 opacity-100 transition-opacity duration-300"
              onClick={() => setBurgerOpen(false)}
              aria-hidden
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                height: "100vh",
                width: "min(280px, 88vw)",
                backgroundColor: "white",
                zIndex: 9998,
                boxShadow: "-4px 0 24px rgba(108, 63, 200, 0.08)",
                transform: "translateX(0)",
                transition: "transform 300ms ease",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#E2DCF5]/90 px-4 py-4">
                <Link
                  href={homeHref}
                  onClick={() => setBurgerOpen(false)}
                  className="flex items-center gap-2.5 no-underline"
                >
                  <Image src="/logo-mark.png" alt="" width={32} height={32} />
                  <span className="text-[17px] font-semibold text-[#1A1033]">Lexiva</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setBurgerOpen(false)}
                  className="rounded-lg p-2 text-[#7C6FA3] transition-colors hover:bg-[#F0EDF8]"
                  aria-label="Fermer le menu"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="px-2 py-3" aria-label="Navigation mobile">
                {navItems.map(({ href, label }) => {
                  const active = isNavActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setBurgerOpen(false)}
                      className="block rounded-lg px-4 py-3 text-[15px] font-medium no-underline transition-colors"
                      style={{
                        color: active ? "#6C3FC8" : "#1A1033",
                        background: active ? "rgba(108, 63, 200, 0.08)" : "transparent",
                      }}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
