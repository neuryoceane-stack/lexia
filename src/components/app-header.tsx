"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
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

function capitalizeDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const ACCOUNT_MENU_HONEYCOMB = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48' viewBox='0 0 56 48'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='0.65'%3E%3Cpath d='M14 4 L28 4 L35 12 L28 20 L14 20 L7 12 Z'/%3E%3Cpath d='M28 20 L42 20 L49 28 L42 36 L28 36 L21 28 Z'/%3E%3C/g%3E%3C/svg%3E")`;

function AvatarDropdown({
  name,
  isProfesseur,
}: {
  name: string;
  isProfesseur?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) {
      setPanelEntered(false);
      return;
    }
    if (reducedMotion) {
      setPanelEntered(true);
      return;
    }
    const id = requestAnimationFrame(() => setPanelEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open, reducedMotion]);

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
  const displayName = capitalizeDisplayName(name);
  const xpInLevel = userXP % 1000;
  const xpPct = Math.min(100, (xpInLevel / 1000) * 100);
  const motionTransition = reducedMotion ? "none" : "120ms ease-out";
  const xpWidthTransition = reducedMotion ? "none" : "width 300ms ease";

  const iconTileStyle: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "rgba(108,63,200,.09)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

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
          role="menu"
          aria-label="Menu compte"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 9999,
            width: 248,
            backgroundColor: "white",
            borderRadius: 18,
            boxShadow:
              "0 4px 24px rgba(108,63,200,.12), 0 1px 3px rgba(108,63,200,.08)",
            border: "0.5px solid rgba(108,63,200,.12)",
            overflow: "hidden",
            transformOrigin: "top right",
            opacity: panelEntered ? 1 : 0,
            transform: panelEntered ? "scale(1)" : "scale(0.96)",
            transition: reducedMotion
              ? "none"
              : `opacity ${motionTransition}, transform ${motionTransition}`,
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {/* En-tête identité */}
          <div
            className="relative flex items-start gap-3 overflow-hidden"
            style={{
              padding: "16px 16px 14px",
              background:
                "linear-gradient(150deg, #7B4AD4 0%, #6C3FC8 55%, #5A32A8 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                zIndex: 0,
                background:
                  "radial-gradient(circle at 100% 120%, rgba(245,166,35,.22), transparent 60%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                zIndex: 1,
                opacity: 0.06,
                backgroundImage: ACCOUNT_MENU_HONEYCOMB,
                backgroundSize: "56px 48px",
                backgroundPosition: "14px 10px",
              }}
            />
            <div
              className="relative z-[2] flex shrink-0 items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,.18)",
                color: "white",
                fontSize: 17,
                fontWeight: 600,
                boxShadow:
                  "0 0 0 2px rgba(245,166,35,.85), inset 0 0 0 1px rgba(255,255,255,.35)",
              }}
            >
              {initial}
            </div>
            <div className="relative z-[2] min-w-0 flex-1">
              <p
                className="truncate"
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "white",
                  letterSpacing: "-0.01em",
                  marginBottom: 2,
                }}
              >
                {displayName}
              </p>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.7)", marginBottom: 8 }}>
                {isProfesseur ? "Professeur" : "Étudiant"}
              </p>
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: "rgba(255,255,255,.16)",
                  color: "white",
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: 999,
                }}
              >
                <Star size={11} stroke="#F7B733" fill="#F7B733" aria-hidden />
                Niveau {userLevel} — {getLevelName(userLevel)}
              </span>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ textAlign: "right", lineHeight: 1 }}>
                  <span
                    style={{
                      fontSize: 10,
                      lineHeight: 1,
                      color: "rgba(255,255,255,.85)",
                    }}
                  >
                    {xpInLevel} / 1000 XP
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "rgba(255,255,255,.20)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${xpPct}%`,
                      background: "linear-gradient(90deg, #F5A623, #F7B733)",
                      borderRadius: 999,
                      transition: xpWidthTransition,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ padding: 6 }}>
            <AccountMenuNavItem
              href="/app/parametres/information-personnelle"
              icon={User}
              label="Mon profil"
              onNavigate={() => setOpen(false)}
              reducedMotion={reducedMotion}
              iconTileStyle={iconTileStyle}
            />

            {!isProfesseur && (
              <div
                role="presentation"
                className="flex items-center"
                style={{
                  borderRadius: 10,
                  padding: "8px 10px",
                  gap: 8,
                  cursor: "default",
                }}
              >
                <div style={iconTileStyle}>
                  <ShoppingBag size={16} stroke="#6C3FC8" aria-hidden />
                </div>
                <span className="flex-1" style={{ fontSize: 13.5, color: "#1A1A1A", fontWeight: 500 }}>
                  Lexi Shop
                </span>
                <span
                  style={{
                    background: "#F5A623",
                    color: "white",
                    fontSize: 9.5,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    marginRight: 3,
                  }}
                >
                  Bientôt
                </span>
              </div>
            )}

            <AccountMenuNavItem
              href="/app/parametres"
              icon={Settings}
              label="Paramètres"
              onNavigate={() => setOpen(false)}
              reducedMotion={reducedMotion}
              iconTileStyle={iconTileStyle}
            />
          </div>

          <div
            style={{
              height: 1,
              background: "rgba(108,63,200,.08)",
              margin: "6px 10px",
            }}
          />

          <div style={{ padding: "0 6px 6px" }}>
            <AccountMenuLogoutButton
              onLogout={() => {
                setOpen(false);
                void handleLogout();
              }}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenuNavItem({
  href,
  icon: Icon,
  label,
  onNavigate,
  reducedMotion,
  iconTileStyle,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onNavigate: () => void;
  reducedMotion: boolean;
  iconTileStyle: CSSProperties;
}) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-1"
      style={{
        borderRadius: 10,
        padding: "8px 10px",
        gap: 8,
        background: hover ? "rgba(108,63,200,.06)" : "transparent",
        transition: reducedMotion ? "none" : "background 120ms ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={iconTileStyle}>
        <Icon size={16} stroke="#6C3FC8" aria-hidden />
      </div>
      <span className="flex-1" style={{ fontSize: 13.5, color: "#1A1A1A", fontWeight: 500 }}>
        {label}
      </span>
      <ChevronRight
        size={15}
        stroke={hover ? "#6C3FC8" : "#B8B2C4"}
        aria-hidden
        style={{
          flexShrink: 0,
          transform: hover ? "translateX(1px)" : "translateX(0)",
          transition: reducedMotion ? "none" : "transform 120ms ease, stroke 120ms ease",
        }}
      />
    </Link>
  );
}

function AccountMenuLogoutButton({
  onLogout,
  reducedMotion,
}: {
  onLogout: () => void;
  reducedMotion: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onLogout}
      className="flex w-full items-center outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-1"
      style={{
        borderRadius: 10,
        padding: "9px 10px",
        gap: 10,
        background: hover ? "rgba(229,72,77,.07)" : "transparent",
        border: "none",
        cursor: "pointer",
        transition: reducedMotion ? "none" : "background 120ms ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <LogOut size={16} stroke="#E5484D" aria-hidden />
      <span style={{ fontSize: 13.5, color: "#E5484D", fontWeight: 500 }}>Déconnexion</span>
    </button>
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
