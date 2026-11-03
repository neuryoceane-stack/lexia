"use client";

import dynamic from "next/dynamic";

const OnboardingWrapper = dynamic(
  () =>
    import("@/components/onboarding-wrapper").then((m) => ({
      default: m.OnboardingWrapper,
    })),
  { ssr: false }
);

export function OnboardingWrapperLazy(props: {
  role: "etudiant" | "professeur";
}) {
  return <OnboardingWrapper {...props} />;
}
