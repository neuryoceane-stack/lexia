import { DM_Sans } from "next/font/google";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { loadSubscriptionView } from "@/lib/stripe-billing";
import { AbonnementClient } from "./abonnement-client";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role === "professeur") redirect("/app/professeur");

  const subscription = await loadSubscriptionView(user.id);
  if (!subscription) redirect("/login");

  const params = await searchParams;
  const checkout =
    params.checkout === "success" || params.checkout === "cancel" ? params.checkout : null;

  return (
    <div className={dmSans.className}>
      <AbonnementClient initial={subscription} checkout={checkout} />
    </div>
  );
}
