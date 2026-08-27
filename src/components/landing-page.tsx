"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Brain, FileText, LineChart, ListPlus, Loader2, MousePointerClick, Users, type LucideIcon } from "lucide-react";

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
    desc: "PDF, photo ou texte brut. Lexiva extrait les mots pour toi.",
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
      <section className="relative min-h-screen overflow-hidden bg-[#F8F7FF] px-4 pt-16 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          {/* Orbe 1 : grand cercle violet foncé */}
          <div
            className="animate-float-8s absolute left-10 top-20 h-64 w-64 rounded-full bg-[#6C3FC8] opacity-[0.07] blur-3xl"
            aria-hidden
          />
          {/* Orbe 2 : cercle violet moyen */}
          <div
            className="animate-float-12s absolute right-20 top-40 h-48 w-48 rounded-full bg-[#6C3FC8] opacity-[0.06] blur-2xl"
            aria-hidden
          />
          {/* Orbe 3 : petit cercle doré */}
          <div
            className="animate-float-10s absolute bottom-20 left-1/3 h-32 w-32 rounded-full bg-[#F5A623] opacity-[0.08] blur-2xl"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Image
            src="/logo-mark.png"
            alt=""
            width={260}
            height={260}
            style={{ objectFit: "contain" }}
            className="mx-auto mb-6"
          />
          <h1 className="font-heading text-4xl font-bold leading-tight text-[#1F1235] sm:text-5xl md:text-6xl lg:text-7xl">
            Le vocabulaire{" "}
            <span className="animate-gradient-text">vivant</span>,
            <br />
            depuis tes vraies lectures
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#6B6B7B]">
            Importe n&apos;importe quel texte. Clique sur les mots inconnus.
            Lexiva s&apos;occupe du reste.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group w-full rounded-xl bg-[#6C3FC8] px-8 py-3.5 text-center font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_24px_rgba(108,63,200,0.25)] sm:w-auto"
            >
              Commencer gratuitement →
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border-2 border-[#6C3FC8] px-8 py-3.5 text-center font-semibold text-[#6C3FC8] transition-all duration-300 hover:bg-[#6C3FC8]/5 sm:w-auto"
            >
              Se connecter
            </Link>
          </div>

          <div className="relative mx-auto mt-16 h-32 w-full max-w-md">
            {DEMO_CARDS.map((card, i) => (
              <div
                key={i}
                className="animate-typing-card absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-[#ECE7F8] bg-white px-6 py-4 shadow-[0_4px_20px_rgba(108,63,200,0.08)]"
              >
                <span className="font-mono text-lg text-[#1F1235]">
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
        className="bg-white px-4 py-16"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
          {STATS.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-heading text-3xl font-bold text-[#1F1235] sm:text-4xl">
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
                <p className="mt-1 text-sm text-[#6B6B7B]">{s.label}</p>
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
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-7xl font-bold text-[#F5A623]/20">
                      {step.num}
                    </span>
                    <step.Icon
                      className="h-9 w-9 text-[#6C3FC8]"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
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
      <section className="relative overflow-hidden bg-white px-4 py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="font-heading text-center text-2xl font-bold text-[#1F1235] sm:text-3xl">
            Tes textes deviennent tes cours
          </h2>
          <p className="mb-4 mt-12 text-center text-sm italic text-[#9A95A8]">
            👆 Touche les mots surlignés pour voir la traduction
          </p>
          <div className="relative rounded-2xl border border-[#ECE7F8] bg-white p-6 shadow-[0_4px_20px_rgba(108,63,200,0.08)]">
            <p className="select-none text-lg leading-relaxed text-[#1F1235]">
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
                        ? "inline-block cursor-pointer touch-manipulation rounded px-2.5 py-2.5 -my-1.5 underline decoration-[#F5A623] decoration-dotted underline-offset-2 hover:bg-[#6C3FC8]/10 active:bg-[#6C3FC8]/15"
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
                      <span className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#ECE7F8] bg-white px-3 py-2 text-sm text-[#F5A623] shadow-xl">
                        {def}
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          </div>
          <p className="mt-6 text-center text-sm text-[#9A95A8]">
            Fonctionne avec n&apos;importe quel texte — article de presse,
            roman, affiche, menu
          </p>
        </div>
      </section>

      {/* SECTION 5 — POUR LES PROFS */}
      <section className="bg-[#E8E0F5] px-4 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-[#6C3FC8]/20 px-4 py-1.5 text-sm font-medium text-[#6C3FC8]">
            🏫 Espace enseignant
          </span>
          <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <h2 className="font-heading text-2xl font-bold text-slate-800 sm:text-3xl">
              Pour les professeurs aussi
            </h2>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#F5A623] px-2.5 py-0.5 text-xs font-semibold text-[#1A1035]">
              Bientôt disponible
            </span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {TEACHER_FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                aria-disabled="true"
                className="pointer-events-none rounded-xl border border-slate-200 bg-white p-6 opacity-85 select-none"
              >
                <Icon
                  className="mx-auto h-9 w-9 text-[#6C3FC8]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="mt-4 font-semibold text-slate-800">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-5 w-full max-w-[520px] rounded-2xl border border-[#ECE7F8] bg-white p-5 text-left shadow-[0_4px_20px_rgba(108,63,200,0.08)] sm:p-6">
            <p className="text-sm leading-relaxed text-slate-700">
              Vous êtes enseignant&nbsp;? Laissez votre email, nous vous prévenons dès
              l&apos;ouverture de l&apos;espace enseignant.
            </p>

            {teacherWaitlistStatus === "success" ? (
              <p
                className="mt-4 rounded-xl border border-[#1D9E75]/30 bg-[#E1F5EE] px-4 py-3 text-sm font-medium text-[#1D9E75]"
                role="status"
              >
                C&apos;est noté&nbsp;! On vous prévient dès l&apos;ouverture.
              </p>
            ) : teacherWaitlistStatus === "already" ? (
              <p
                className="mt-4 rounded-xl border border-[#6C3FC8]/20 bg-[#6C3FC8]/5 px-4 py-3 text-sm font-medium text-[#6C3FC8]"
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
                <div className="flex flex-col overflow-hidden rounded-xl border-2 border-[#E2DCF5] focus-within:border-[#6C3FC8] sm:flex-row sm:items-stretch">
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
                    className="min-h-[52px] min-w-0 flex-1 border-0 bg-white px-4 py-3.5 text-base text-[#1F1235] outline-none placeholder:text-[#9A95A8] disabled:opacity-60 sm:rounded-none"
                  />
                  <button
                    type="submit"
                    disabled={teacherWaitlistStatus === "loading"}
                    className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 whitespace-nowrap border-t border-[#E2DCF5] bg-[#6C3FC8] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#5529A0] disabled:cursor-not-allowed disabled:opacity-60 sm:border-t-0 sm:border-l sm:border-[#5529A0]/20 sm:px-4"
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
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    Veuillez saisir une adresse email valide.
                  </p>
                )}
                {teacherWaitlistStatus === "error" && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    Une erreur est survenue. Veuillez réessayer.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA FINAL */}
      <section className="bg-[#F8F7FF] px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-[#1F1235] sm:text-4xl">
            Envie d&apos;apprendre autrement ?
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-[#6C3FC8] px-12 py-4 text-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_24px_rgba(108,63,200,0.25)]"
          >
            Créer mon compte gratuitement
          </Link>
          <p className="mt-6 text-sm text-[#9A95A8]">
            Gratuit · Sans carte bancaire · En 30 secondes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#F0EDF8] px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-[#E2DAF2] pb-8 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image src="/logo-mark.png" alt="" width={32} height={32} style={{ objectFit: "contain" }} className="flex-shrink-0" />
              <div>
                <p className="font-heading text-lg font-semibold text-[#1F1235]">
                  Lexiva
                </p>
                <p className="mt-1 text-sm text-[#9A95A8]">
                  Apprends le vocabulaire autrement
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <Link
                href="/login"
                className="text-sm font-medium text-[#6B6B7B] transition hover:text-[#6C3FC8]"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-[#6B6B7B] transition hover:text-[#6C3FC8]"
              >
                Inscription
              </Link>
            </div>
          </div>
          <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#9A95A8]"
            aria-label="Liens légaux"
          >
            <Link href="/mentions-legales" className="transition hover:text-[#6C3FC8]">
              Mentions légales
            </Link>
            <span aria-hidden>·</span>
            <Link href="/politique-de-confidentialite" className="transition hover:text-[#6C3FC8]">
              Politique de confidentialité
            </Link>
            <span aria-hidden>·</span>
            <Link href="/cgv" className="transition hover:text-[#6C3FC8]">
              CGV
            </Link>
            <span aria-hidden>·</span>
            <Link href="/contact" className="transition hover:text-[#6C3FC8]">
              Contact
            </Link>
          </nav>
          <p className="mt-4 text-center text-xs text-[#9A95A8]">
            Fait avec ❤️ à Paris
          </p>
        </div>
      </footer>
    </div>
  );
}
