"use client";

import { useState } from "react";

type Step = {
  title: string;
  description: string;
  emoji: string;
};

const STUDENT_STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Bienvenue sur Lexiva !",
    description: "Voici comment ça marche en 4 étapes.",
  },
  {
    emoji: "📚",
    title: "Ta bibliothèque",
    description:
      "Importe tes listes de vocabulaire ici — depuis une photo, un PDF ou en tapant directement.",
  },
  {
    emoji: "⚡",
    title: "Révise intelligemment",
    description:
      "Flashcards, dictée, quiz… Lexiva adapte les exercices à ce que tu retiens le moins bien.",
  },
  {
    emoji: "🌿",
    title: "Mots Sauvages",
    description:
      "Prends en photo n'importe quel texte et clique sur les mots inconnus pour les ajouter instantanément.",
  },
  {
    emoji: "📊",
    title: "Ta progression",
    description:
      "Suis tes stats, ta streak et tes points ici. La régularité fait tout.",
  },
];

const TEACHER_STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Bienvenue, professeur !",
    description:
      "Lexiva vous aide à suivre la progression de vos élèves. Créons votre première classe.",
  },
  {
    emoji: "🏫",
    title: "Vos classes",
    description:
      "Gérez vos élèves ici — ajoutez-les par lien d'invitation ou importez une liste.",
  },
  {
    emoji: "📋",
    title: "Assigner du vocabulaire",
    description:
      "Choisissez une liste et assignez-la à une ou plusieurs classes.",
  },
  {
    emoji: "📈",
    title: "Suivi en temps réel",
    description:
      "Visualisez la progression de chaque élève, les mots maîtrisés et ceux à revoir.",
  },
];

type Props = {
  role: "etudiant" | "professeur";
  onComplete: () => void;
};

export function OnboardingTour({ role, onComplete }: Props) {
  const steps = role === "professeur" ? TEACHER_STEPS : STUDENT_STEPS;
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  const step = steps[current];
  const isLast = current === steps.length - 1;

  if (!visible) return null;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      onComplete();
      return;
    }
    setCurrent((c) => Math.min(c + 1, steps.length - 1));
  };

  const handleSkip = () => {
    setVisible(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl" aria-hidden>
              {step.emoji}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {step.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {step.description}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            Passer
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={
                  "h-1.5 w-4 rounded-full " +
                  (idx === current
                    ? "bg-primary"
                    : "bg-slate-200 dark:bg-slate-700")
                }
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Plus tard
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
            >
              {isLast ? "Terminer" : "Suivant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

