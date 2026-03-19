import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import Stripe from "stripe";

const MONTH_NAMES = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    return NextResponse.json({ stripeNotConfigured: true });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

  try {
    // 1. MRR & abonnés actifs
    const activeSubs = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    let mrr = 0;
    for (const sub of activeSubs.data) {
      for (const item of sub.items.data) {
        mrr += (item.price?.unit_amount ?? 0) / 100;
      }
    }
    const activeSubscribers = activeSubs.data.length;

    // 2. Revenus mois en cours vs mois précédent
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const chargesThisMonth = await stripe.charges.list({
      limit: 100,
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
    });

    const chargesPrevMonth = await stripe.charges.list({
      limit: 100,
      created: {
        gte: Math.floor(startOfPrevMonth.getTime() / 1000),
        lt: Math.floor(startOfMonth.getTime() / 1000),
      },
    });

    const revenueThisMonth = chargesThisMonth.data
      .filter((c) => c.status === "succeeded")
      .reduce((sum, c) => sum + c.amount / 100, 0);

    const revenuePrevMonth = chargesPrevMonth.data
      .filter((c) => c.status === "succeeded")
      .reduce((sum, c) => sum + c.amount / 100, 0);

    const monthVariation =
      revenuePrevMonth > 0
        ? Math.round(
            ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100,
          )
        : revenueThisMonth > 0
          ? 100
          : 0;

    // 3. Historique MRR 12 derniers mois
    const mrrHistory: { month: string; revenue: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1,
      );

      const monthCharges = await stripe.charges.list({
        limit: 100,
        created: {
          gte: Math.floor(monthStart.getTime() / 1000),
          lt: Math.floor(monthEnd.getTime() / 1000),
        },
      });

      const monthRevenue = monthCharges.data
        .filter((c) => c.status === "succeeded")
        .reduce((sum, c) => sum + c.amount / 100, 0);

      mrrHistory.push({
        month: MONTH_NAMES[monthStart.getMonth()],
        revenue: Math.round(monthRevenue * 100) / 100,
      });
    }

    // 4. 10 derniers paiements
    const recentCharges = await stripe.charges.list({ limit: 10 });
    const recentPayments = recentCharges.data.map((c) => ({
      date: new Date(c.created * 1000).toISOString(),
      email: c.billing_details?.email ?? "—",
      amount: c.amount / 100,
      status: c.refunded
        ? "refunded"
        : c.status === "succeeded"
          ? "paid"
          : "failed",
    }));

    // 5. Alertes
    const alerts: { type: "churn" | "unpaid"; message: string }[] = [];

    const sevenDaysAgo = Math.floor(
      (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000,
    );
    const canceledSubs = await stripe.subscriptions.list({
      status: "canceled",
      limit: 100,
    });
    const recentCancels = canceledSubs.data.filter(
      (s) => (s.canceled_at ?? 0) >= sevenDaysAgo,
    );
    if (recentCancels.length > 3) {
      alerts.push({
        type: "churn",
        message: `${recentCancels.length} désabonnements ces 7 derniers jours`,
      });
    }

    const fortyEightHoursAgo = Math.floor(
      (Date.now() - 48 * 60 * 60 * 1000) / 1000,
    );
    const recentFailedCharges = await stripe.charges.list({ limit: 50 });
    const oldFailed = recentFailedCharges.data.filter(
      (c) => c.status === "failed" && c.created < fortyEightHoursAgo,
    );
    if (oldFailed.length > 0) {
      alerts.push({
        type: "unpaid",
        message: `${oldFailed.length} paiement(s) échoué(s) depuis plus de 48h`,
      });
    }

    return NextResponse.json({
      mrr: Math.round(mrr * 100) / 100,
      activeSubscribers,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      revenuePrevMonth: Math.round(revenuePrevMonth * 100) / 100,
      monthVariation,
      mrrHistory,
      recentPayments,
      alerts,
    });
  } catch (error) {
    console.error("Finance API error:", error);
    return NextResponse.json({ error: "Erreur Stripe" }, { status: 500 });
  }
}
