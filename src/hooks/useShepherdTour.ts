"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Shepherd from "shepherd.js";
import type { StepOptions, StepOptionsButton } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import "@/styles/shepherd-lexiva.css";
import { BRAND_NAME } from "@/lib/brand";

type ShepherdTour = InstanceType<typeof Shepherd.Tour>;
type AppRouter = ReturnType<typeof useRouter>;
type Role = "etudiant" | "professeur";

function waitForElement(
  selector: string,
  callback: () => void,
  timeout = 3000,
) {
  const el = document.querySelector(selector);
  if (el) {
    callback();
    return;
  }
  const observer = new MutationObserver(() => {
    if (document.querySelector(selector)) {
      observer.disconnect();
      callback();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => {
    observer.disconnect();
    callback();
  }, timeout);
}

function navigateAndWait(
  router: AppRouter,
  path: string,
  selector: string,
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (window.location.pathname === path) {
      waitForElement(selector, resolve);
    } else {
      router.push(path);
      waitForElement(selector, resolve);
    }
  });
}

function skipButton(tour: ShepherdTour): StepOptionsButton {
  return {
    text: "Passer",
    action: () => tour.cancel(),
    secondary: true,
  };
}

function withSkipOnEveryStep(
  tour: ShepherdTour,
  steps: StepOptions[],
): StepOptions[] {
  return steps.map((step) => ({
    ...step,
    buttons: [...(step.buttons ?? []), skipButton(tour)],
  }));
}

async function finishTourAndGo(
  tour: ShepherdTour,
  router: AppRouter,
  onComplete: () => void | Promise<void>,
  path: string,
) {
  await onComplete();
  tour.complete();
  router.push(path);
}

function buildStudentSteps(
  tour: ShepherdTour,
  router: AppRouter,
  onComplete: () => void | Promise<void>,
): StepOptions[] {
  return [
    {
      id: "welcome",
      title: `Bienvenue sur ${BRAND_NAME} ✨`,
      text: `
        <div class="lx-welcome">
          <p class="lx-intro">La méthode la plus efficace pour mémoriser du vocabulaire — enfin disponible.</p>
          <div class="lx-pills">
            <span class="lx-pill">📚 Bibliothèque</span>
            <span class="lx-pill">⚡ Révision</span>
            <span class="lx-pill">🌿 Mots Sauvages</span>
            <span class="lx-pill">📊 Synthèse</span>
          </div>
          <p class="lx-sub">Visite guidée en 1 minute →</p>
        </div>
      `,
      buttons: [{ text: "C'est parti 🚀", action: () => tour.next() }],
    },
    {
      id: "bibliotheque",
      title: "📚 Ta Bibliothèque",
      text: `
        <p>Toutes tes <strong>listes de vocabulaire</strong> au même endroit.</p>
        <ul class="lx-list">
          <li>📄 Importe un PDF ou une photo</li>
          <li>✍️ Tape directement tes mots</li>
          <li>🗂️ Organise tes listes</li>
        </ul>
      `,
      attachTo: { element: 'a[href="/app/familles"]', on: "bottom" },
      beforeShowPromise: () =>
        navigateAndWait(router, "/app", 'a[href="/app/familles"]'),
      buttons: [{ text: "Suivant →", action: () => tour.next() }],
    },
    {
      id: "revision",
      title: "⚡ Révision",
      text: `
        <p>Deux modes d'entraînement <strong>adaptés à ton niveau</strong> :</p>
        <ul class="lx-list">
          <li>🃏 <strong>Flashcards</strong> — recto/verso, mémorisation visuelle</li>
          <li>✏️ <strong>Dictée</strong> — écris le mot, ${BRAND_NAME} corrige</li>
        </ul>
        <p class="lx-tip">🧠 L'algorithme SM-2 choisit les mots à revoir au bon moment.</p>
      `,
      attachTo: { element: 'a[href="/app/revision"]', on: "bottom" },
      beforeShowPromise: () =>
        navigateAndWait(router, "/app", 'a[href="/app/revision"]'),
      buttons: [{ text: "Suivant →", action: () => tour.next() }],
    },
    {
      id: "finish",
      title: "🎉 Tu es prêt !",
      text: `
        <div class="lx-finish">
          <p class="lx-intro">Importe ta première liste pour commencer à réviser.</p>
        </div>
      `,
      beforeShowPromise: () =>
        navigateAndWait(router, "/app", 'a[href="/app/familles"]'),
      buttons: [
        {
          text: "Importe ta première liste",
          action: () => {
            void finishTourAndGo(tour, router, onComplete, "/app/familles/nouvelle-liste");
          },
        },
      ],
    },
  ];
}

function buildTeacherSteps(
  tour: ShepherdTour,
  router: AppRouter,
  onComplete: () => void | Promise<void>,
): StepOptions[] {
  return [
    {
      id: "classe",
      title: "Créer votre classe",
      text: `
        <p>Donnez un nom à votre classe. Le code et le lien d'invitation sont prêts tout de suite.</p>
      `,
      attachTo: {
        element: 'a[href="/app/professeur/classes"]',
        on: "bottom",
      },
      beforeShowPromise: () =>
        navigateAndWait(
          router,
          "/app/professeur",
          'a[href="/app/professeur/classes"]',
        ),
      buttons: [{ text: "Suivant", action: () => tour.next() }],
    },
    {
      id: "liste",
      title: "Ajouter une liste",
      text: `
        <p>Créez une liste dans votre bibliothèque, assignez-la à la classe, puis rendez-la visible.</p>
      `,
      attachTo: { element: 'a[href="/app/familles"]', on: "bottom" },
      beforeShowPromise: () =>
        navigateAndWait(router, "/app/professeur", 'a[href="/app/familles"]'),
      buttons: [
        { text: "Retour", action: () => tour.back(), secondary: true },
        { text: "Suivant", action: () => tour.next() },
      ],
    },
    {
      id: "inviter",
      title: "Inviter vos élèves",
      text: `
        <p>Sur la page de la classe, copiez le lien ou le message. Vos élèves créent un compte, puis vous les acceptez.</p>
      `,
      attachTo: {
        element: 'a[href="/app/professeur/classes"]',
        on: "bottom",
      },
      beforeShowPromise: () =>
        navigateAndWait(
          router,
          "/app/professeur",
          'a[href="/app/professeur/classes"]',
        ),
      buttons: [
        { text: "Retour", action: () => tour.back(), secondary: true },
        {
          text: "Créer ma classe",
          action: () => {
            void finishTourAndGo(
              tour,
              router,
              onComplete,
              "/app/professeur/classes?creer=1",
            );
          },
        },
      ],
    },
  ];
}

export function useShepherdTour(role: Role, onComplete: () => void) {
  const router = useRouter();
  const tourRef = useRef<ShepherdTour | null>(null);

  const startTour = useCallback(() => {
    if (tourRef.current) return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: "smooth", block: "center" },
        modalOverlayOpeningPadding: 10,
        modalOverlayOpeningRadius: 12,
      },
    });

    const rawSteps =
      role === "professeur"
        ? buildTeacherSteps(tour, router, onComplete)
        : buildStudentSteps(tour, router, onComplete);

    tour.addSteps(withSkipOnEveryStep(tour, rawSteps));

    tour.on("complete", () => {
      void onComplete();
    });
    tour.on("cancel", () => {
      void onComplete();
    });

    tourRef.current = tour;
    tour.start();
  }, [role, onComplete, router]);

  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.cancel();
        tourRef.current = null;
      }
    };
  }, []);

  return { startTour };
}
