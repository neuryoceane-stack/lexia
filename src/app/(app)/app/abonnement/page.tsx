import { DM_Sans } from "next/font/google";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { loadSubscriptionView, confirmCheckoutSessionForUser, billingHttpError } from "@/lib/stripe-billing";
import { AbonnementClient } from "./abonnement-client";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string | string[] }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role === "professeur") redirect("/app/professeur");

  const params = await searchParams;
  const checkout =
    params.checkout === "success" || params.checkout === "cancel" ? params.checkout : null;
  const sessionId = readSessionId(params.session_id);

  let confirmationError: string | null = null;
  if (checkout === "success") {
    if (!sessionId) {
      confirmationError = "Le retour de paiement ne contient pas la session Stripe.";
    } else {
      try {
        await confirmCheckoutSessionForUser(user.id, sessionId);
      } catch (error) {
        confirmationError = billingMessage(error, "Impossible de confirmer le paiement.");
      }
    }
  }

  let subscription = null;
  let loadError: string | null = null;
  try {
    subscription = await loadSubscriptionView(user.id);
  } catch (error) {
    loadError = billingMessage(error, "Impossible de lire votre abonnement.");
  }

  if (!subscription) {
    return (
      <div className={dmSans.className}>
        <p role="alert" style={{ fontSize: 15, color: "#B42318" }}>
          {loadError ?? "Impossible de lire votre abonnement."}
        </p>
      </div>
    );
  }

  return (
    <div className={dmSans.className}>
      <AbonnementClient
        initial={subscription}
        checkout={checkout}
        confirmationError={confirmationError}
      />
    </div>
  );
}

function readSessionId(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

function billingMessage(error: unknown, fallback: string): string {
  const httpError = billingHttpError(error);
  if (httpError) return httpError.message;
  console.error("[abonnement]", error);
  return fallback;
}
