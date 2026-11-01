"use client";

import { useState, useRef, useEffect, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsBell } from "@/components/notifications-bell";
import {
  Star,
  User,
  Settings,
  LogOut,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Home,
  Library,
  ClipboardList,
  ChartColumn,
  Users,
  BookOpen,
  Bolt,
  type LucideIcon,
} from "lucide-react";
import { SHOP_ENABLED } from "@/lib/feature-flags";

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

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Correspondance stricte : indispensable pour Accueil (/app), sinon toute l'app est active. */
  exact?: boolean;
};

const navItemsStudent: NavItem[] = [
  { href: "/app", label: "Accueil", icon: Home, exact: true },
  { href: "/app/familles", label: "Bibliothèque", icon: Library },
  { href: "/app/revision", label: "Révision", icon: ClipboardList },
  { href: "/app/jardin", label: "Synthèse", icon: ChartColumn },
];

const navItemsProfesseur: NavItem[] = [
  { href: "/app/professeur", label: "Accueil", icon: Home, exact: true },
  { href: "/app/professeur/classes", label: "Mes classes", icon: Users },
  { href: "/app/familles", label: "Ma bibliothèque", icon: BookOpen },
];


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
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-[var(--surface)] text-sm font-medium text-ink ${className ?? ""}`}
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
    background: "color-mix(in srgb, var(--ink) 9%, transparent)",
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
        className={`flex rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
          open ? "ring-2 ring-ink/30 ring-offset-2" : ""
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
            backgroundColor: "var(--surface)",
            borderRadius: 18,
            boxShadow:
              "0 4px 24px color-mix(in srgb, var(--ink) 12%, transparent), 0 1px 3px color-mix(in srgb, var(--ink) 8%, transparent)",
            border: "0.5px solid color-mix(in srgb, var(--ink) 12%, transparent)",
            overflow: "hidden",
            transformOrigin: "top right",
            opacity: panelEntered ? 1 : 0,
            transform: panelEntered ? "scale(1)" : "scale(0.96)",
            transition: reducedMotion
              ? "none"
              : `opacity ${motionTransition}, transform ${motionTransition}`,
            fontFamily: "var(--font-sans), sans-serif",
          }}
        >
          {/* En-tête identité */}
          <div
            className="relative flex items-start gap-3 overflow-hidden"
            style={{
              padding: "16px 16px 14px",
              background: "var(--ink)",
            }}
          >
            <div
              className="relative z-[2] flex shrink-0 items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "color-mix(in srgb, var(--surface) 18%, transparent)",
                color: "var(--surface)",
                fontSize: 17,
                fontWeight: 600,
                boxShadow:
                  "0 0 0 2px var(--mark), inset 0 0 0 1px color-mix(in srgb, var(--surface) 35%, transparent)",
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
                  color: "var(--surface)",
                  letterSpacing: "-0.01em",
                  marginBottom: 2,
                }}
              >
                {displayName}
              </p>
              <p style={{ fontSize: 11.5, color: "color-mix(in srgb, var(--surface) 75%, transparent)", marginBottom: 8 }}>
                {isProfesseur ? "Professeur" : "Étudiant"}
              </p>
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: "color-mix(in srgb, var(--surface) 16%, transparent)",
                  color: "var(--surface)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: 999,
                }}
              >
                <Star size={11} stroke="var(--mark)" fill="var(--mark)" aria-hidden />
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
                      color: "color-mix(in srgb, var(--surface) 85%, transparent)",
                    }}
                  >
                    {xpInLevel} / 1000 XP
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "color-mix(in srgb, var(--surface) 20%, transparent)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${xpPct}%`,
                      background: "var(--mark)",
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
              <AccountMenuNavItem
                href="/app/abonnement"
                icon={CreditCard}
                label="Abonnement"
                onNavigate={() => setOpen(false)}
                reducedMotion={reducedMotion}
                iconTileStyle={iconTileStyle}
              />
            )}

            {!isProfesseur && SHOP_ENABLED && (
              <AccountMenuNavItem
                href="/app/shop"
                icon={ShoppingBag}
                label="Lexi Shop"
                onNavigate={() => setOpen(false)}
                reducedMotion={reducedMotion}
                iconTileStyle={iconTileStyle}
              />
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
              background: "color-mix(in srgb, var(--ink) 8%, transparent)",
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
      className="flex items-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
      style={{
        borderRadius: 10,
        padding: "8px 10px",
        gap: 8,
        background: hover ? "color-mix(in srgb, var(--ink) 6%, transparent)" : "transparent",
        transition: reducedMotion ? "none" : "background 120ms ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={iconTileStyle}>
        <Icon size={16} stroke="var(--ink)" aria-hidden />
      </div>
      <span className="flex-1" style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>
        {label}
      </span>
      <ChevronRight
        size={15}
        stroke={hover ? "var(--ink)" : "var(--muted)"}
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
      className="flex w-full items-center outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
      style={{
        borderRadius: 10,
        padding: "9px 10px",
        gap: 10,
        background: hover ? "var(--false-bg)" : "transparent",
        border: "none",
        cursor: "pointer",
        transition: reducedMotion ? "none" : "background 120ms ease",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <LogOut size={16} stroke="var(--false-sign)" aria-hidden />
      <span style={{ fontSize: 13.5, color: "var(--false-sign)", fontWeight: 500 }}>Déconnexion</span>
    </button>
  );
}

const navItemCreator: NavItem = { href: "/app/creator", label: "Créateur", icon: Bolt };

function NavTabLabel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3.5"
      style={{
        minHeight: 36,
        background: active ? "var(--mark)" : "transparent",
        color: "var(--ink)",
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
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
  const displayName = user?.name || user?.email?.split("@")[0] || "Utilisateur";
  const baseNavItems = isProfesseur ? navItemsProfesseur : navItemsStudent;
  const navItems = isCreator ? [...baseNavItems, navItemCreator] : baseNavItems;
  const homeHref = isProfesseur ? "/app/professeur" : "/app";

  function isNavActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    const matches = pathname === item.href || pathname.startsWith(item.href + "/");
    if (!matches) return false;
    const coveredByLonger = navItems.some(
      (other) =>
        other.href !== item.href &&
        other.href.startsWith(item.href + "/") &&
        (pathname === other.href || pathname.startsWith(other.href + "/"))
    );
    return !coveredByLonger;
  }

  return (
    <>
      <header
        className="sticky top-0 z-20 flex h-[72px] items-center border-b bg-[var(--surface)]"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="mx-auto flex h-full w-full max-w-[1200px] items-center gap-6 px-4 sm:px-6">
          <Link
            href={homeHref}
            className="inline-flex shrink-0 items-center gap-3 no-underline outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            aria-label="Lexiva — Accueil"
            style={{ fontFamily: "var(--font-sans), sans-serif" }}
          >
            <Image
              src="/logo-mark.png"
              alt=""
              width={36}
              height={36}
              style={{ objectFit: "contain" }}
              priority
            />
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
              Lexiva
            </span>
          </Link>

          <nav
            className="hidden flex-1 items-center gap-1 md:flex"
            aria-label="Navigation principale"
            style={{ fontFamily: "var(--font-sans), sans-serif" }}
          >
            {navItems.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="inline-flex min-h-11 items-center text-[14px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                >
                  <NavTabLabel active={active}>{item.label}</NavTabLabel>
                </Link>
              );
            })}
          </nav>

          <div className="flex-1 md:hidden" aria-hidden />

          <div className="flex shrink-0 items-center gap-3">
            <NotificationsBell />
            <AvatarDropdown name={displayName} isProfesseur={isProfesseur} />
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-[var(--surface)] md:hidden"
        style={{ height: 76, borderColor: "var(--line)" }}
        aria-label="Navigation principale"
      >
        <ul className="mx-auto flex h-full max-w-[1200px] items-stretch px-1">
          {navItems.map((item) => {
            const active = isNavActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex min-w-0 flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex min-h-11 w-full flex-col items-center justify-center gap-0.5 no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  style={{ fontFamily: "var(--font-sans), sans-serif" }}
                >
                  <span
                    className="inline-flex items-center justify-center"
                    style={{
                      minWidth: 36,
                      height: 28,
                      paddingInline: 8,
                      borderRadius: 8,
                      background: active ? "var(--mark)" : "transparent",
                    }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={1.8}
                      color={active ? "var(--ink)" : "var(--muted)"}
                      aria-hidden
                    />
                  </span>
                  <span
                    className="max-w-full truncate px-0.5 text-[11px]"
                    style={{
                      fontWeight: 500,
                      color: active ? "var(--ink)" : "var(--muted)",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
