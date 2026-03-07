import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/**
 * POST /api/translate
 * Body: { text: string, sourceLang: string, targetLang: string }
 * Lang: ISO 639-1 (en, fr, es, de, it, ...).
 * Claude en priorité, MyMemory en fallback.
 * Returns { translation: string, example: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { text?: string; sourceLang?: string; targetLang?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const text = (body.text ?? "").trim();
  const sourceLang = (body.sourceLang ?? "en").slice(0, 5);
  const targetLang = (body.targetLang ?? "fr").slice(0, 5);

  if (!text) {
    return NextResponse.json(
      { error: "Le texte à traduire est requis" },
      { status: 400 }
    );
  }

  const CLAUDE_SYSTEM = `Tu es un expert en linguistique. Pour le mot donné :
- Verbe conjugué → donne l'infinitif + traduction
- Nom au pluriel → donne le singulier + traduction
- Adjectif accordé → donne la forme de base + traduction
- Mot invariable → traduis directement
Réponds UNIQUEMENT en JSON valide sans markdown :
{"translation": "forme canonique : traduction", "example": "phrase courte max 10 mots en langue source"}`;

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system: CLAUDE_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Traduis ce mot du ${sourceLang} vers le ${targetLang}.\nMot: ${text}`,
          },
        ],
      });
      const textContent = response.content.find((c) => c.type === "text");
      const raw = textContent?.type === "text" ? textContent.text.trim() : "";
      if (!raw) {
        return NextResponse.json(
          { error: "Réponse vide du service de traduction IA" },
          { status: 502 }
        );
      }
      try {
        const parsed = JSON.parse(raw) as {
          translation?: string;
          example?: string;
        };
        const translation = (parsed.translation ?? raw).trim();
        const example = (parsed.example ?? "").trim();
        return NextResponse.json({ translation, example });
      } catch {
        return NextResponse.json({ translation: raw, example: "" });
      }
    } catch (err) {
      console.error("Claude translate error:", err);
    }
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${sourceLang}|${targetLang}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    if (res.ok) {
      const translation = data.responseData?.translatedText?.trim() ?? "";
      return NextResponse.json({ translation, example: "" });
    }
  } catch (err) {
    console.error("MyMemory translate error:", err);
  }

  return NextResponse.json(
    { error: "Impossible de traduire pour le moment" },
    { status: 502 }
  );
}
