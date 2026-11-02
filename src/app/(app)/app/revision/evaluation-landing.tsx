"use client";

import Link from "next/link";
import { ArrowRight, Mic, Pencil, RectangleHorizontal } from "lucide-react";

function ModeIcon({ icon: Icon }: { icon: typeof Pencil }) {
  return (
    <span
      className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-mark"
      aria-hidden
    >
      <Icon size={26} strokeWidth={2} color="var(--ink)" />
    </span>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border-[1.5px] border-line bg-surface px-3 py-1 text-xs font-medium text-ink">
      {children}
    </span>
  );
}

function StartLabel() {
  return (
    <span className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-base font-medium text-surface">
      Commencer
      <ArrowRight size={18} aria-hidden />
    </span>
  );
}

const cardClass =
  "relative flex h-full flex-col rounded-[20px] border-[1.5px] border-line bg-surface p-6 no-underline lg:p-7";

export function EvaluationLanding() {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <header className="mb-8 lg:mb-10">
        <h1 className="font-heading text-[32px] leading-[1.15] text-ink lg:text-[44px]">
          On s&apos;entraîne <span className="marker">comment</span>{" "}
          <span className="whitespace-nowrap">aujourd&apos;hui ?</span>
        </h1>
        <p className="mt-3 text-base text-muted">
          Flashcards pour mémoriser, dictée pour ancrer.
        </p>
      </header>

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
        <Link
          href="/app/revision/flashcards"
          className={`${cardClass} transition hover:-translate-y-0.5 hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
        >
          <ModeIcon icon={RectangleHorizontal} />
          <h2 className="font-heading text-[26px] leading-tight text-ink">Flashcards</h2>
          <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">
            Révisez avec des cartes intelligentes — l&apos;algorithme SM-2
            optimise votre mémorisation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip>Révision espacée</Chip>
            <Chip>Swipe</Chip>
            <Chip>Timer</Chip>
          </div>
          <StartLabel />
        </Link>

        <Link
          href="/app/revision/dictee"
          className={`${cardClass} transition hover:-translate-y-0.5 hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
        >
          <ModeIcon icon={Pencil} />
          <h2 className="font-heading text-[26px] leading-tight text-ink">Dictée</h2>
          <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">
            Écrivez la traduction de mémoire — le mode le plus efficace pour
            ancrer les mots.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip>Mémoire active</Chip>
            <Chip>Feedback</Chip>
          </div>
          <StartLabel />
        </Link>

        <div className={`${cardClass} opacity-70`} aria-disabled="true">
          <span className="absolute right-5 top-5 rounded-full border-[1.5px] border-ink bg-surface px-3 py-1 text-xs font-medium text-ink">
            Bientôt
          </span>
          <ModeIcon icon={Mic} />
          <h2 className="font-heading text-[26px] leading-tight text-ink">Prononciation</h2>
          <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">
            Enregistrez votre voix et obtenez un score phonétique — arrive
            bientôt.
          </p>
          <span
            className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-full text-base font-medium text-muted"
            style={{ background: "color-mix(in srgb, var(--line) 65%, var(--page))" }}
          >
            Bientôt disponible
          </span>
        </div>
      </div>
    </div>
  );
}
