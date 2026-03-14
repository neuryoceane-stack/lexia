"use client";

import { useEffect, useCallback, useState } from "react";
import { useShepherdTour } from "@/hooks/useShepherdTour";

type Props = {
  role: "etudiant" | "professeur";
};

export function OnboardingWrapper({ role }: Props) {
  const [done, setDone] = useState(false);

  const handleComplete = useCallback(async () => {
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
