"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { ABONNEMENT_PATH } from "@/lib/abonnement-path";

const PaywallBlockedContext = createContext(false);

export function PaywallBlockedProvider({
  blocked,
  children,
}: {
  blocked: boolean;
  children: React.ReactNode;
}) {
  return (
    <PaywallBlockedContext.Provider value={blocked}>
      {children}
    </PaywallBlockedContext.Provider>
  );
}

export function usePaywallBlocked(): boolean {
  return useContext(PaywallBlockedContext);
}

/**
 * Vrai si l'élève est renvoyé vers l'abonnement.
 * Les boutons d'ajout et de révision appellent ça avant d'ouvrir leur flux.
 */
export function useLeaveForAbonnement(): () => boolean {
  const blocked = usePaywallBlocked();
  const router = useRouter();
  return useCallback(() => {
    if (!blocked) return false;
    router.push(ABONNEMENT_PATH);
    return true;
  }, [blocked, router]);
}
