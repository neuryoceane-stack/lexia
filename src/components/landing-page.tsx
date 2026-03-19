"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const DEMO_CARDS = [
  { term: "distorto", def: "distorcere : déformer", lang: "it" },
  { term: "embrace", def: "embrace : étreindre", lang: "en" },
  { term: "hermosa", def: "hermoso : beau", lang: "es" },
];

const STATS = [
  { value: 10000, suffix: "+", label: "mots appris" },
  { value: 50, suffix: "+", label: "langues" },
  { value: "SM-2", suffix: "", label: "prouvé" },
];

const STEPS = [
  {
    num: "01",
    icon: "📄",
    title: "Importe ton texte",
    desc: "PDF, photo ou texte brut. Lexiva extrait les mots pour toi.",
  },
  {
    num: "02",
    icon: "💡",
    title: "Clique sur un mot",
    desc: "Traduction instantanée avec forme canonique (infinitif, singulier). Exemple inclus.",
  },
  {
    num: "03",
    icon: "🧠",
    title: "Révise intelligemment",
    desc: "Algorithme SM-2 adapté à ton niveau. Mémorisation durable.",
  },
];

const SAMPLE_TEXT = `La tecnologia avanza rapidamente. El aprendizaje de idiomas se ha transformado con herramientas modernas. Los estudiantes pueden ahora practicar con materiales auténticos y recibir retroalimentación instantánea.`;

const SAMPLE_WORDS = [
  { word: "tecnologia", def: "technologie" },
  { word: "avanza", def: "avance" },
  { word: "rapidamente", def: "rapidement" },
  { word: "aprendizaje", def: "apprentissage" },
  { word: "idiomas", def: "langues" },
  { word: "transformado", def: "transformé" },
  { word: "herramientas", def: "outils" },
  { word: "estudiantes", def: "étudiants" },
  { word: "auténticos", def: "authentiques" },
  { word: "retroalimentación", def: "retour" },
];

function useInView(threshold = 0.2) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function LandingPage() {
  const statsRef = useInView();
  const step1Ref = useInView();
  const step2Ref = useInView();
  const step3Ref = useInView();
  const [hoverWord, setHoverWord] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);

  const dismissBanner = useCallback(() => setShowDeletedBanner(false), []);

  useEffect(() => {
    if (searchParams.get("deleted") === "true") {
      setShowDeletedBanner(true);
      router.replace("/");
      const timer = setTimeout(dismissBanner, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, dismissBanner]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {showDeletedBanner && (
        <div className="relative flex items-center justify-center gap-2 bg-[#dcfce7] px-4 py-3 text-sm font-medium text-[#166534]">
          <span>✓ Votre compte a bien été supprimé. À bientôt sur Lexiva.</span>
          <button
            type="button"
            onClick={dismissBanner}
            className="absolute right-3 text-[#166534]/60 transition hover:text-[#166534]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-screen overflow-hidden bg-[#0A0612] px-4 pt-16 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          {/* Orbe 1 : grand cercle violet foncé */}
          <div
            className="animate-float-8s absolute left-10 top-20 h-64 w-64 rounded-full bg-[#4A2C7A] opacity-30 blur-3xl"
            aria-hidden
          />
          {/* Orbe 2 : cercle violet moyen */}
          <div
            className="animate-float-12s absolute right-20 top-40 h-48 w-48 rounded-full bg-[#6C3FC8] opacity-20 blur-2xl"
            aria-hidden
          />
          {/* Orbe 3 : petit cercle doré */}
          <div
            className="animate-float-10s absolute bottom-20 left-1/3 h-32 w-32 rounded-full bg-[#F5A623] opacity-15 blur-2xl"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Image
            src="/logo.png"
            alt=""
            width={80}
            height={80}
            style={{ objectFit: "contain" }}
            className="mx-auto mb-6"
          />
          <div className="badge-border-shimmer mb-6 inline-flex rounded-full p-[1px] backdrop-blur-sm">
            <span className="rounded-full bg-[#0A0612]/95 px-4 py-2 text-xs font-medium text-[#F5A623]">
              ✨ Propulsé par Claude AI
            </span>
          </div>

          <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Le vocabulaire{" "}
            <span className="animate-gradient-text">vivant</span>,
            <br />
            depuis tes vraies lectures
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Importe n&apos;importe quel texte. Clique sur les mots inconnus.
            Lexiva s&apos;occupe du reste.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group w-full rounded-xl bg-[#6C3FC8] px-8 py-3.5 text-center font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(108,63,200,0.5)] sm:w-auto"
            >
              Commencer gratuitement →
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border-2 border-white/40 px-8 py-3.5 text-center font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto"
            >
              Se connecter
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-white/50">
            🎓 Rejoins les premiers étudiants sur Lexiva
          </p>

          <div className="relative mx-auto mt-16 h-32 w-full max-w-md">
            {DEMO_CARDS.map((card, i) => (
              <div
                key={i}
                className="animate-typing-card absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-4 backdrop-blur-md"
              >
                <span className="font-mono text-lg text-white/90">
                  {card.term}
                </span>
                <span className="mt-1 text-sm text-[#F5A623]">
                  → {card.def}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATS */}
      <section
        ref={statsRef.ref}
        className="bg-[#0F0820] px-4 py-16"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
          {STATS.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-heading text-3xl font-bold text-white sm:text-4xl">
                  {statsRef.inView ? (
                    typeof s.value === "number" ? (
                      s.value.toLocaleString("fr-FR") + s.suffix
                    ) : (
                      s.value + s.suffix
                    )
                  ) : (
                    "—"
                  )}
                </p>
                <p className="mt-1 text-sm text-white/60">{s.label}</p>
              </div>
              {i < STATS.length - 1 && (
                <div className="hidden h-12 w-px bg-[#F5A623]/50 sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — COMMENT ÇA MARCHE */}
      <section className="bg-white px-4 py-20">
        <h2 className="font-heading text-center text-2xl font-bold text-slate-800 sm:text-3xl">
          Comment ça marche
        </h2>
        <div className="mx-auto max-w-4xl pt-16">
          {STEPS.map((step, i) => {
            const ref = i === 0 ? step1Ref : i === 1 ? step2Ref : step3Ref;
            const isLeft = i % 2 === 0;
            return (
              <div
                key={i}
                ref={ref.ref}
                className={`flex flex-col gap-6 py-12 sm:flex-row sm:items-center ${
                  isLeft ? "" : "sm:flex-row-reverse"
                }`}
              >
                <div
                  className={`flex-1 transition-all duration-700 ${
                    ref.inView
                      ? "translate-x-0 opacity-100"
                      : isLeft
                        ? "-translate-x-12 opacity-0"
                        : "translate-x-12 opacity-0"
                  }`}
                >
                  <span className="font-heading text-7xl font-bold text-[#F5A623]/20">
                    {step.num}
                  </span>
                  <span className="ml-2 text-4xl">{step.icon}</span>
                  <h3 className="mt-2 font-heading text-xl font-semibold text-slate-800">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-slate-600">{step.desc}</p>
                </div>
                <div className="flex-1" />
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — MOTS SAUVAGES */}
      <section className="relative overflow-hidden bg-[#0A0612] px-4 py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="font-heading text-center text-2xl font-bold text-white sm:text-3xl">
            Tes textes deviennent tes cours
          </h2>
          <p className="mb-4 mt-12 text-center text-sm italic text-white/50">
            👆 Passe ta souris sur les mots surlignés
          </p>
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="select-none text-lg leading-relaxed text-white/90">
              {SAMPLE_TEXT.split(/\s+/).map((w, i) => {
                const match = SAMPLE_WORDS.find(
                  (s) => w.toLowerCase().replace(/[.,!?]/g, "") === s.word
                );
                const cleanWord = w.replace(/[.,!?]/g, "");
                const def = match?.def ?? null;
                const isHovered = hoverWord === cleanWord;
                return (
                  <span
                    key={i}
                    className={`relative inline ${
                      def
                        ? "cursor-pointer rounded px-0.5 underline decoration-[#F5A623] decoration-dotted underline-offset-2 hover:bg-[#6C3FC8]/40"
                        : ""
                    }`}
                    onMouseEnter={() => def && setHoverWord(cleanWord)}
                    onMouseLeave={() => setHoverWord(null)}
                  >
                    {w}{" "}
                    {def && isHovered && (
                      <span className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#6C3FC8]/50 bg-[#0A0612] px-3 py-2 text-sm text-[#F5A623] shadow-xl">
                        {def}
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          </div>
          <p className="mt-6 text-center text-sm text-white/50">
            Fonctionne avec n&apos;importe quel texte — article de presse,
            roman, affiche, menu
          </p>
        </div>
      </section>

      {/* SECTION 5 — POUR LES PROFS */}
      <section className="bg-[#E8E0F5] px-4 py-20 dark:bg-[#1A1535]">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-[#6C3FC8]/20 px-4 py-1.5 text-sm font-medium text-[#6C3FC8]">
            🏫 Espace enseignant
          </span>
          <h2 className="mt-4 font-heading text-2xl font-bold text-slate-800 dark:text-white sm:text-3xl">
            Pour les professeurs aussi
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-800 dark:text-white">
                Créer des classes
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Identifiant court pour que les élèves rejoignent
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-800 dark:text-white">
                Assigner des listes
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Depuis ta bibliothèque personnelle
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-800 dark:text-white">
                Suivre les progrès
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Voir l&apos;avancement de chaque élève
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA FINAL */}
      <section className="bg-gradient-to-b from-[#0F0820] to-[#0A0612] px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Prêt à apprendre autrement ?
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-[#6C3FC8] px-12 py-4 text-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(108,63,200,0.5)]"
          >
            Créer mon compte gratuitement
          </Link>
          <p className="mt-6 text-sm text-white/50">
            Gratuit · Sans carte bancaire · En 30 secondes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0612] px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={32} height={32} style={{ objectFit: "contain" }} className="flex-shrink-0" />
              <div>
                <p className="font-heading text-lg font-semibold text-white">
                  Lexiva
                </p>
                <p className="mt-1 text-sm text-white/50">
                  Apprends le vocabulaire autrement
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <Link
                href="/login"
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                Inscription
              </Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-white/40">
            Fait avec ❤️ à Paris
          </p>
        </div>
      </footer>
    </div>
  );
}
