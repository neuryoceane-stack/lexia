"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Brain, Check, FileText, Heart, LineChart, ListPlus, Loader2, MousePointerClick, Pointer, School, Users, X, type LucideIcon } from "lucide-react";
import { OFFER_TRIAL_CARD_LABEL } from "@/lib/offer";
import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/logo";
import { AuthAlert } from "@/components/auth/auth-alert";

const DEMO_CARDS = [
  { term: "distorto", def: "distorcere : déformer", lang: "it" },
  { term: "embrace", def: "embrace : étreindre", lang: "en" },
  { term: "hermosa", def: "hermoso : beau", lang: "es" },
];

const STATS = [
  { value: 10000, suffix: "+", label: "mots à apprendre" },
  { value: 50, suffix: "+", label: "langues" },
  { value: "SM-2", suffix: "", label: "prouvé" },
];

const STEPS: {
  num: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    num: "01",
    Icon: FileText,
    title: "Importe ton texte",
    desc: `PDF, photo ou texte brut. ${BRAND_NAME} extrait les mots pour toi.`,
  },
  {
    num: "02",
    Icon: MousePointerClick,
    title: "Clique sur un mot",
    desc: "Traduction instantanée avec forme canonique (infinitif, singulier). Exemple inclus.",
  },
  {
    num: "03",
    Icon: Brain,
    title: "Révise intelligemment",
    desc: "Algorithme SM-2 adapté à ton niveau. Mémorisation durable.",
  },
];

const TEACHER_FEATURES: {
  Icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    Icon: Users,
    title: "Créer des classes",
    desc: "Identifiant court pour que les élèves rejoignent",
  },
  {
    Icon: ListPlus,
    title: "Assigner des listes",
    desc: "Depuis votre bibliothèque personnelle",
  },
  {
    Icon: LineChart,
    title: "Suivre les progrès",
    desc: "Voir l'avancement de chaque élève",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TeacherWaitlistStatus = "idle" | "invalid" | "loading" | "success" | "already" | "error";

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
  const [tappedWord, setTappedWord] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherWaitlistStatus, setTeacherWaitlistStatus] =
    useState<TeacherWaitlistStatus>("idle");
  const heroRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  const dismissBanner = useCallback(() => setShowDeletedBanner(false), []);

  const submitTeacherWaitlist = useCallback(async () => {
    const email = teacherEmail.trim().toLowerCase();
    if (!email) {
      setTeacherWaitlistStatus("invalid");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setTeacherWaitlistStatus("invalid");
      return;
    }

    setTeacherWaitlistStatus("loading");
    try {
      const res = await fetch("/api/teacher-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyRegistered?: boolean;
      };

      if (!res.ok) {
        setTeacherWaitlistStatus("error");
        return;
      }
      if (data.alreadyRegistered) {
        setTeacherWaitlistStatus("already");
        return;
      }
      setTeacherWaitlistStatus("success");
    } catch {
      setTeacherWaitlistStatus("error");
    }
  }, [teacherEmail]);

  useEffect(() => {
    if (searchParams.get("deleted") === "true") {
      setShowDeletedBanner(true);
      router.replace("/");
      const timer = setTimeout(dismissBanner, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, dismissBanner]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {showDeletedBanner && (
        <div className="relative flex items-center justify-center gap-2 bg-just-bg px-14 py-3 text-sm font-medium text-just-text">
          <Check size={18} strokeWidth={1.8} className="shrink-0 text-just-sign" aria-hidden />
          <span>Ton compte a bien été supprimé. À bientôt sur {BRAND_NAME}.</span>
          <button
            type="button"
            onClick={dismissBanner}
            className="auth-icon-btn absolute right-2 text-ink"
            aria-label="Fermer"
          >
            <X size={18} strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      )}
      <header
        aria-hidden={!headerVisible}
        className={`fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-page/85 backdrop-blur-md transition-all duration-300 ease-out ${
          headerVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex min-h-[72px] max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link href="/" className="flex items-center no-underline" aria-label={BRAND_NAME}>
            <Logo size="header" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="auth-link text-sm">
              Se connecter
            </Link>
            <Link href="/signup" className="auth-submit auth-submit-nav">
              Commencer
            </Link>
          </div>
        </div>
      </header>
      {/* SECTION 1 — HERO */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-page px-4 pb-10 pt-8 sm:pb-12 sm:pt-10"
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* Orbe 1 : grand cercle violet foncé */}
          <div
            className="animate-float-8s absolute left-10 top-20 h-64 w-64 rounded-full bg-ink opacity-[0.07] blur-3xl"
            aria-hidden
          />
          {/* Orbe 2 : cercle violet moyen */}
          <div
            className="animate-float-12s absolute right-20 top-40 h-48 w-48 rounded-full bg-ink opacity-[0.06] blur-2xl"
            aria-hidden
          />
          {/* Orbe 3 : petit cercle doré */}
          <div
            className="animate-float-10s absolute bottom-20 left-1/3 h-32 w-32 rounded-full bg-mark opacity-[0.08] blur-2xl"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Logo size="hero" className="mb-6" />
          <h1 className="font-heading text-4xl font-bold leading-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
            Le vocabulaire{" "}
            <span className="bg-gradient-to-r from-ink to-ink bg-clip-text text-transparent">
              vivant
            </span>,
            <br />
            depuis tes vraies lectures
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-xl text-ink">
            Importe n&apos;importe quel texte. Clique sur les mots inconnus. {BRAND_NAME} s&apos;occupe du reste.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/signup" className="auth-submit auth-submit-inline">
              Commencer →
            </Link>
            <Link href="/login" className="auth-submit-secondary auth-submit-inline">
              Se connecter
            </Link>
          </div>

          <div className="relative mx-auto mt-10 h-28 w-full max-w-md sm:h-32">
            {DEMO_CARDS.map((card, i) => (
              <div
                key={i}
                className="animate-typing-card absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-4 shadow-[0_4px_20px_color-mix(in_srgb,var(--ink)_8%,transparent)]"
              >
                <span className="font-mono text-lg text-ink">
                  {card.term}
                </span>
                <span className="mt-1 text-sm text-ink">
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
        className="bg-surface px-4 py-8 sm:py-10"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
          {STATS.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-heading text-3xl font-bold text-ink sm:text-4xl">
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
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
              {i < STATS.length - 1 && (
                <div className="hidden h-12 w-px bg-mark/50 sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — COMMENT ÇA MARCHE */}
      <section className="bg-surface px-4 py-10 sm:py-12">
        <h2 className="font-heading text-center text-2xl font-bold text-ink sm:text-3xl">
          Comment ça marche
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 pt-8 md:grid-cols-3 md:gap-6 md:pt-10">
          {STEPS.map((step, i) => {
            const ref = i === 0 ? step1Ref : i === 1 ? step2Ref : step3Ref;
            return (
              <div
                key={i}
                ref={ref.ref}
                className={`transition-all duration-700 ${
                  ref.inView
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}
              >
                <div className="flex items-center justify-center gap-3 md:justify-start">
                  <span className="font-heading text-6xl font-bold text-ink/20 sm:text-7xl">
                    {step.num}
                  </span>
                  <step.Icon
                    className="h-9 w-9 text-ink"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <h3 className="mt-2 text-center font-heading text-xl font-semibold text-ink md:text-left">
                  {step.title}
                </h3>
                <p className="mt-2 text-center text-muted md:text-left">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — MOTS SAUVAGES */}
      <section className="relative overflow-hidden bg-surface px-4 py-10 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="font-heading text-center text-2xl font-bold text-ink sm:text-3xl">
            Tes textes deviennent tes cours
          </h2>
          <p className="mb-3 mt-6 flex items-center justify-center gap-2 text-center text-sm italic text-muted">
            <Pointer size={18} strokeWidth={1.8} className="shrink-0 text-ink" aria-hidden />
            Touche les mots surlignés pour voir la traduction
          </p>
          <div className="relative rounded-2xl border border-line bg-surface p-6 shadow-[0_4px_20px_color-mix(in_srgb,var(--ink)_8%,transparent)]">
            <p className="select-none text-lg leading-relaxed text-ink">
              {SAMPLE_TEXT.split(/\s+/).map((w, i) => {
                const match = SAMPLE_WORDS.find(
                  (s) => w.toLowerCase().replace(/[.,!?]/g, "") === s.word
                );
                const cleanWord = w.replace(/[.,!?]/g, "");
                const def = match?.def ?? null;
                const isActive =
                  hoverWord === cleanWord || tappedWord === cleanWord;
                return (
                  <span
                    key={i}
                    role={def ? "button" : undefined}
                    tabIndex={def ? 0 : undefined}
                    aria-expanded={def ? isActive : undefined}
                    aria-label={
                      def ? `${cleanWord}, afficher la traduction` : undefined
                    }
                    className={`relative ${
                      def
                        ? "inline-flex min-h-11 cursor-pointer touch-manipulation items-center rounded px-1.5 underline decoration-ink decoration-dotted underline-offset-2 hover:bg-ink/10 active:bg-ink/15"
                        : "inline"
                    }`}
                    onMouseEnter={() => def && setHoverWord(cleanWord)}
                    onMouseLeave={() => setHoverWord(null)}
                    onClick={() => {
                      if (!def) return;
                      setTappedWord((prev) =>
                        prev === cleanWord ? null : cleanWord
                      );
                    }}
                    onKeyDown={(e) => {
                      if (!def) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTappedWord((prev) =>
                          prev === cleanWord ? null : cleanWord
                        );
                      }
                    }}
                  >
                    {w}{" "}
                    {def && isActive && (
                      <span className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-xl">
                        {def}
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            Fonctionne avec n&apos;importe quel texte — article de presse,
            roman, affiche, menu
          </p>
        </div>
      </section>

      {/* SECTION 5 — POUR LES PROFS */}
      <section className="bg-[var(--background-subtle)] px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-surface px-3 py-1.5 text-sm font-medium text-ink">
            <School size={16} strokeWidth={1.8} aria-hidden />
            Espace professeur
          </span>
          <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <h2 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
              Pour les professeurs aussi
            </h2>
            <span className="inline-flex shrink-0 items-center rounded-full bg-mark px-2.5 py-0.5 text-xs font-semibold text-ink">
              Bientôt disponible
            </span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {TEACHER_FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                aria-disabled="true"
                className="pointer-events-none rounded-xl border border-line bg-surface p-6 opacity-85 select-none"
              >
                <Icon
                  className="mx-auto h-9 w-9 text-ink"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="mt-4 font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-5 w-full max-w-[520px] rounded-2xl border border-line bg-surface p-5 text-left shadow-[0_4px_20px_color-mix(in_srgb,var(--ink)_8%,transparent)] sm:p-6">
            <p className="text-sm leading-relaxed text-ink">
              Vous êtes professeur&nbsp;? Laissez votre email, nous vous prévenons dès
              l&apos;ouverture de l&apos;espace professeur.
            </p>

            {teacherWaitlistStatus === "success" ? (
              <p
                className="mt-4 rounded-xl border border-line/30 bg-surface px-4 py-3 text-sm font-medium text-ink"
                role="status"
              >
                C&apos;est noté&nbsp;! On vous prévient dès l&apos;ouverture.
              </p>
            ) : teacherWaitlistStatus === "already" ? (
              <p
                className="mt-4 rounded-xl border border-ink/20 bg-ink/5 px-4 py-3 text-sm font-medium text-ink"
                role="status"
              >
                Vous êtes déjà sur la liste.
              </p>
            ) : (
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitTeacherWaitlist();
                }}
              >
                <div className="flex flex-col gap-3">
                  <label htmlFor="teacher-waitlist-email" className="sr-only">
                    Votre adresse email
                  </label>
                  <input
                    id="teacher-waitlist-email"
                    type="email"
                    value={teacherEmail}
                    onChange={(e) => {
                      setTeacherEmail(e.target.value);
                      if (
                        teacherWaitlistStatus === "invalid" ||
                        teacherWaitlistStatus === "error"
                      ) {
                        setTeacherWaitlistStatus("idle");
                      }
                    }}
                    placeholder="vous@etablissement.fr"
                    autoComplete="email"
                    disabled={teacherWaitlistStatus === "loading"}
                    className="auth-field"
                  />
                  <button
                    type="submit"
                    disabled={teacherWaitlistStatus === "loading"}
                    className="auth-submit"
                  >
                    {teacherWaitlistStatus === "loading" ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        Envoi…
                      </>
                    ) : (
                      "Prévenez-moi"
                    )}
                  </button>
                </div>
                {teacherWaitlistStatus === "invalid" && (
                  <AuthAlert className="mt-3">Veuillez saisir une adresse email valide.</AuthAlert>
                )}
                {teacherWaitlistStatus === "error" && (
                  <AuthAlert className="mt-3">Une erreur est survenue. Veuillez réessayer.</AuthAlert>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA FINAL */}
      <section className="bg-page px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            Envie d&apos;apprendre autrement ?
          </h2>
          <Link href="/signup" className="auth-submit auth-submit-inline mt-6">
            Créer mon compte
          </Link>
          <p className="mt-4 text-sm text-muted">
            {OFFER_TRIAL_CARD_LABEL} · En 30 secondes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--background-subtle)] px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-5 border-b border-line pb-6 sm:flex-row">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <Logo size="header" />
              <p className="text-sm text-muted">
                Apprends le vocabulaire autrement
              </p>
            </div>
            <div className="flex gap-6">
              <Link href="/login" className="auth-link text-sm">
                Connexion
              </Link>
              <Link href="/signup" className="auth-link text-sm">
                Inscription
              </Link>
            </div>
          </div>
          <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted"
            aria-label="Liens légaux"
          >
            <Link href="/mentions-legales" className="auth-link text-xs">
              Mentions légales
            </Link>
            <span aria-hidden>·</span>
            <Link href="/politique-de-confidentialite" className="auth-link text-xs">
              Politique de confidentialité
            </Link>
            <span aria-hidden>·</span>
            <Link href="/cgv" className="auth-link text-xs">
              CGV
            </Link>
            <span aria-hidden>·</span>
            <Link href="/contact" className="auth-link text-xs">
              Contact
            </Link>
          </nav>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
            Fait avec
            <Heart size={14} strokeWidth={1.8} className="text-ink" aria-hidden />
            <span className="sr-only">cœur</span>
            à Paris
          </p>
        </div>
      </footer>
    </div>
  );
}
