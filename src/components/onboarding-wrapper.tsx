"use client";

import { useState } from "react";
import { OnboardingTour } from "@/components/onboarding-tour";

type Props = {
  role: "etudiant" | "professeur";
};

export function OnboardingWrapper({ role }: Props) {
  const [done, setDone] = useState(false);
  if (done) return null;
  return <OnboardingTour role={role} onComplete={() => setDone(true)} />;
}

