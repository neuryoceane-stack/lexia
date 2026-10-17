"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useShepherdTour } from "@/hooks/useShepherdTour";

type Props = {
  role: "etudiant" | "professeur";
};

export function OnboardingWrapper({ role }: Props) {
  const [done, setDone] = useState(false);
  const completingRef = useRef(false);

  const handleComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    setDone(true);
    try {
      await fetch("/api/user/onboarding", { method: "PATCH" });
    } catch {
      /* silently ignore – the tour still dismisses */
    }
  }, []);

  const { startTour } = useShepherdTour(role, handleComplete);

  useEffect(() => {
    if (!done) {
      startTour();
    }
  }, [done, startTour]);

  return null;
}
