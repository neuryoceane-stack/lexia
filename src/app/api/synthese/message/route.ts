import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

const CLAUDE_SYSTEM = `Tu es un coach motivant pour une app d'apprentissage de vocabulaire en langues étrangères.
Tu dois écrire 2 à 3 phrases courtes, chaleureuses et personnalisées pour encourager l'utilisateur.
Utilise les données fournies (streak, mots appris cette semaine, langue principale) pour personnaliser ton message.
Ton style : bienveillant, positif, pas trop long. Tu peux utiliser 1 emoji max (🔥, ✨, 💪, etc.).
Réponds UNIQUEMENT avec le message en français, sans guillemets ni préambule.`;

/**
 * POST /api/synthese/message
 * Body: { streak: number, wordsThisWeek: number, mainLanguage: string }
 * Génère un message motivant personnalisé via Claude.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "Service de message non configuré" },
      { status: 503 }
    );
  }

  let body: { streak?: number; wordsThisWeek?: number; mainLanguage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const streak = typeof body.streak === "number" ? body.streak : 0;
  const wordsThisWeek = typeof body.wordsThisWeek === "number" ? body.wordsThisWeek : 0;
  const mainLanguage = typeof body.mainLanguage === "string" ? body.mainLanguage.trim().slice(0, 20) : "";

  const langLabels: Record<string, string> = {
    eng: "anglais",
    fra: "français",
    deu: "allemand",
    spa: "espagnol",
    ita: "italien",
    por: "portugais",
    nld: "néerlandais",
    pol: "polonais",
    rus: "russe",
    jpn: "japonais",
    zho: "mandarin",
    ell: "grec",
  };
  const langLabel = mainLanguage ? (langLabels[mainLanguage] ?? mainLanguage) : "";

  const userPrompt = [
    `Streak actuel : ${streak} jour${streak !== 1 ? "s" : ""} consécutif${streak !== 1 ? "s" : ""}.`,
    `Mots appris cette semaine : ${wordsThisWeek}.`,
    mainLanguage ? `Langue principale : ${langLabel}.` : "Pas de langue principale.",
  ].join(" ");

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system: CLAUDE_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const message = textContent?.type === "text" ? textContent.text.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Réponse vide du service" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/synthese/message]", msg);
    return NextResponse.json(
      { error: "Erreur lors de la génération du message" },
      { status: 500 }
    );
  }
}
