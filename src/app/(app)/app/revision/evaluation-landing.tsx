"use client";

import Link from "next/link";

type EvaluationCard = {
  id: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  gradient: string;
  enabled: boolean;
  badge?: string;
};

const cards: EvaluationCard[] = [
  {
    id: "flashcards",
    href: "/app/revision/flashcards",
    icon: "🃏",
    title: "Flashcards",
    description: "Révise avec des cartes · Swipe · Algorithme SM-2",
    gradient: "linear-gradient(135deg, #6C3FC8 0%, #8B5CF6 100%)",
    enabled: true,
  },
  {
    id: "dictee",
    href: "/app/revision/dictee",
    icon: "✍️",
    title: "Dictée",
    description: "Écris la traduction · Feedback immédiat · Active ta mémoire",
    gradient: "linear-gradient(135deg, #F5A623 0%, #F97316 100%)",
    enabled: true,
  },
  {
    id: "prononciation",
    href: "#",
    icon: "🎤",
    title: "Prononciation",
    description: "Enregistre ta voix · Score phonétique · Bientôt disponible",
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    enabled: false,
    badge: "Bientôt",
  },
];

export function EvaluationLanding() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
          Évaluation
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Choisis ton mode d&apos;entraînement
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => {
          const content = (
            <div
              className={`relative flex flex-col rounded-[20px] p-8 shadow-xl transition-transform duration-200 hover:-translate-y-1 ${
                !card.enabled ? "opacity-70" : ""
              }`}
              style={{
                background: card.gradient,
                minHeight: "220px",
              }}
            >
              {card.badge && (
                <span
                  className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-800"
                  style={{ opacity: 1 }}
                >
                  {card.badge}
                </span>
              )}
              <span
                className="text-[48px] leading-none"
                aria-hidden
              >
                {card.icon}
              </span>
              <h2 className="mt-4 text-xl font-bold text-white">
                {card.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/90">
                {card.description}
              </p>
              {card.enabled ? (
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-white/95">
                  Commencer →
                </span>
              ) : (
                <span className="mt-4 inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-lg bg-white/60 px-4 py-2.5 text-sm font-medium text-slate-600">
                  Bientôt
                </span>
              )}
            </div>
          );

          return card.enabled ? (
            <Link
              key={card.id}
              href={card.href}
              className="block"
            >
              {content}
            </Link>
          ) : (
            <div key={card.id} className="block cursor-not-allowed">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
