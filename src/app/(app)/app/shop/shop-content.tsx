"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { LanguagePill, languageShort } from "@/app/(app)/app/revision/revision-ui";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { assignShopCoverVariants } from "@/lib/shop-cover-theme";
import { ShopCollectionMeter } from "./shop-collection-meter";
import { ShopCoverCard } from "./shop-cover-card";
import { ShopDetailPanel } from "./shop-detail-panel";
import type { ShopPackClient } from "./shop-types";

const SHOP_LANG_CODES = ["eng", "deu", "spa", "ita", "fra"] as const;

function languageLabel(code: string): string {
  return PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code.toUpperCase();
}

function parsePacks(data: unknown): ShopPackClient[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is ShopPackClient =>
      typeof row === "object" &&
      row !== null &&
      typeof (row as ShopPackClient).id === "string" &&
      typeof (row as ShopPackClient).title === "string"
  );
}

export function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packs, setPacks] = useState<ShopPackClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [langInitialized, setLangInitialized] = useState(false);
  const [focusedPackId, setFocusedPackId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [purchaseBanner, setPurchaseBanner] = useState<{
    kind: "success" | "pending" | "canceled";
    pack?: ShopPackClient;
  } | null>(null);

  const loadPacks = useCallback(async () => {
    const res = await fetch("/api/shop/packs");
    if (!res.ok) throw new Error("fetch");
    const data = parsePacks(await res.json());
    setPacks(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadPacks();
        if (cancelled) return;
        setLoadError(null);
        if (!langInitialized) {
          let preferred: string | null = null;
          try {
            const prefRes = await fetch("/api/user/preferences");
            if (prefRes.ok) {
              const pref = await prefRes.json();
              const langs = Array.isArray(pref.preferredLanguages)
                ? (pref.preferredLanguages as string[])
                : [pref.preferredLanguage].filter(Boolean);
              preferred = (langs[0] as string | undefined) ?? null;
            }
          } catch {
            /* préférences facultatives */
          }
          const langsWithPacks = SHOP_LANG_CODES.filter((code) =>
            data.some((p) => p.language === code)
          );
          const initial =
            (preferred && langsWithPacks.includes(preferred as (typeof SHOP_LANG_CODES)[number])
              ? preferred
              : langsWithPacks[0]) ?? langsWithPacks[0] ?? "eng";
          setSelectedLang(initial);
          setLangInitialized(true);
        }
      } catch {
        if (!cancelled) setLoadError("Impossible de charger la boutique.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPacks, langInitialized]);

  const language = selectedLang ?? "eng";

  const packsInLang = useMemo(
    () => packs.filter((p) => p.language === language),
    [packs, language]
  );

  const ownedInLang = useMemo(() => packsInLang.filter((p) => p.owned).length, [packsInLang]);

  const coverVariants = useMemo(() => assignShopCoverVariants(packsInLang), [packsInLang]);

  const focusedPack = useMemo(() => {
    const candidate = packsInLang.find((p) => p.id === focusedPackId);
    if (candidate) return candidate;
    return packsInLang[0] ?? null;
  }, [packsInLang, focusedPackId]);

  useEffect(() => {
    if (packsInLang.length === 0) {
      setFocusedPackId(null);
      return;
    }
    if (!focusedPackId || !packsInLang.some((p) => p.id === focusedPackId)) {
      setFocusedPackId(packsInLang[0].id);
    }
  }, [packsInLang, focusedPackId]);

  const reviseHref = useCallback((pack: ShopPackClient) => {
    if (pack.listId) {
      return `/app/revision/flashcards?listIds=${encodeURIComponent(pack.listId)}`;
    }
    return `/app/familles?lang=${encodeURIComponent(pack.language)}`;
  }, []);

  const handleBuy = useCallback(
    async (pack: ShopPackClient) => {
      if (pack.owned) {
        router.push(reviseHref(pack));
        return;
      }
      setBuyingId(pack.id);
      try {
        const res = await fetch("/api/shop/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId: pack.id }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url as string;
          return;
        }
      } catch {
        /* noop */
      } finally {
        setBuyingId(null);
      }
    },
    [reviseHref, router]
  );

  useEffect(() => {
    const canceled = searchParams.get("canceled") === "true";
    if (canceled) {
      setPurchaseBanner({ kind: "canceled" });
      router.replace("/app/shop");
      return;
    }
    const success = searchParams.get("success") === "true";
    const packId = searchParams.get("pack");
    if (!success || !packId) return;

    let tries = 0;
    const interval = window.setInterval(async () => {
      tries += 1;
      try {
        const data = await loadPacks();
        const pack = data.find((p) => p.id === packId);
        if (pack?.owned) {
          setPurchaseBanner({ kind: "success", pack });
          setFocusedPackId(pack.id);
          window.clearInterval(interval);
          router.replace("/app/shop");
          return;
        }
        if (tries >= 12) {
          setPurchaseBanner({ kind: "pending", pack: pack ?? undefined });
          window.clearInterval(interval);
          router.replace("/app/shop");
        }
      } catch {
        if (tries >= 12) {
          setPurchaseBanner({ kind: "pending" });
          window.clearInterval(interval);
          router.replace("/app/shop");
        }
      }
    }, 1200);

    return () => window.clearInterval(interval);
  }, [searchParams, loadPacks, router]);

  const availableLangs = useMemo(() => {
    return SHOP_LANG_CODES.filter((code) => packs.some((p) => p.language === code));
  }, [packs]);

  if (loading) {
    return <ShopSkeleton />;
  }

  if (loadError) {
    return (
      <p className="rounded-2xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
        {loadError}
      </p>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface px-6 py-14 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-line text-ink">
          <ShoppingBag size={26} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-4 font-heading text-xl font-bold text-ink">Bientôt de nouvelles listes</h2>
        <p className="mt-2 text-sm text-muted">
          La boutique se prépare. Revenez un peu plus tard pour découvrir les collections par langue.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-surface"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <header className="mb-6">
        <h1 className="font-heading text-[30px] font-bold leading-tight text-ink sm:text-[34px]">
          Lexi Shop
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-[15px]">
          Choisissez une liste et constituez votre collection, une langue à la fois. Chaque achat rejoint votre
          bibliothèque pour toujours.
        </p>
      </header>

      {purchaseBanner ? (
        <div
          className={`mb-5 rounded-2xl border-[1.5px] px-4 py-4 sm:px-5 ${
            purchaseBanner.kind === "canceled"
              ? "border-line bg-surface text-muted"
              : "border-ink bg-surface"
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {purchaseBanner.kind === "success" ? (
                <>
                  <p className="font-heading text-lg font-bold text-ink">
                    Liste{" "}
                    <span className="marker inline bg-[linear-gradient(104deg,transparent_1%,var(--mark)_3%,var(--mark)_94%,transparent_99%)] px-1.5">
                      ajoutée à votre bibliothèque
                    </span>
                  </p>
                  {purchaseBanner.pack ? (
                    <p className="mt-1 text-sm text-muted">{purchaseBanner.pack.title} est prête pour vous.</p>
                  ) : null}
                </>
              ) : null}
              {purchaseBanner.kind === "pending" ? (
                <>
                  <p className="font-medium text-ink">Paiement reçu</p>
                  <p className="mt-1 text-sm text-muted">
                    Votre liste arrive dans quelques secondes. Actualisez la page si besoin.
                  </p>
                </>
              ) : null}
              {purchaseBanner.kind === "canceled" ? (
                <p className="text-sm">Paiement annulé. Vous pouvez reprendre quand vous le souhaitez.</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setPurchaseBanner(null)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          {purchaseBanner.kind === "success" && purchaseBanner.pack ? (
            <Link
              href={reviseHref(purchaseBanner.pack)}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-surface sm:w-auto sm:px-6"
            >
              Réviser cette liste
            </Link>
          ) : null}
        </div>
      ) : null}

      <ShopCollectionMeter language={language} ownedCount={ownedInLang} totalCount={packsInLang.length} />

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {availableLangs.map((code) => {
          const active = code === language;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedLang(code)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                active
                  ? "border-ink bg-mark text-ink"
                  : "border-line bg-surface text-muted"
              }`}
            >
              <LanguagePill code={languageShort(code)} />
              {languageLabel(code)}
            </button>
          );
        })}
      </div>

      {packsInLang.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          Aucune liste active pour cette langue pour le moment.
        </p>
      ) : (
        <>
          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            Listes à posséder — {languageLabel(language).toLowerCase()}
          </p>
          <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {packsInLang.map((pack) => (
              <ShopCoverCard
                key={pack.id}
                pack={pack}
                coverVariant={coverVariants.get(pack.id) ?? "diagonal"}
                focused={focusedPack?.id === pack.id}
                onSelect={() => setFocusedPackId(pack.id)}
                onBuy={() => void handleBuy(pack)}
                onRevise={() => router.push(reviseHref(pack))}
                buying={buyingId === pack.id}
              />
            ))}
          </div>
          {focusedPack ? (
            <ShopDetailPanel
              pack={focusedPack}
              buying={buyingId === focusedPack.id}
              onBuy={() => void handleBuy(focusedPack)}
              onRevise={() => router.push(reviseHref(focusedPack))}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true">
      <div className="h-9 w-48 rounded-lg bg-[color-mix(in_srgb,var(--line)_55%,var(--page))]" />
      <div className="h-24 rounded-2xl bg-[color-mix(in_srgb,var(--line)_40%,var(--page))]" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-11 w-28 rounded-full bg-[color-mix(in_srgb,var(--line)_45%,var(--page))]" />
        ))}
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-[280px] w-[220px] shrink-0 rounded-2xl bg-[color-mix(in_srgb,var(--line)_40%,var(--page))]"
          />
        ))}
      </div>
    </div>
  );
}