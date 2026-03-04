import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import OpenAI from "openai";

/**
 * POST /api/translate
 * Body: { text: string, sourceLang: string, targetLang: string }
 * Lang: ISO 639-1 (en, fr, es, de, it, ...).
 * Utilise OpenAI (si OPENAI_API_KEY défini), sinon MyMemory.
 * Returns { translation: string }
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

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  // 1) Traduction « intelligente » via OpenAI si configuré
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content:
              "Tu es un traducteur spécialisé en vocabulaire. Traduis uniquement le texte donné, sans ajouter d'explications ni de guillemets.",
          },
          {
            role: "user",
            content: `Traduis ce texte du ${sourceLang} vers le ${targetLang}.\nTexte: ${text}`,
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      if (!raw) {
        return NextResponse.json(
          { error: "Réponse vide du service de traduction IA" },
          { status: 502 }
        );
      }
      return NextResponse.json({ translation: raw });
    } catch (err) {
      console.error("OpenAI translate error:", err);
      // On ne masque pas l'erreur : si l'IA tombe, on retourne une erreur explicite.
      return NextResponse.json(
        { error: "Erreur du service de traduction IA" },
        { status: 502 }
      );
    }
  }

  // 2) Fallback sans clé : MyMemory (qualité variable mais gratuite)
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${sourceLang}|${targetLang}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    if (!res.ok) {
      return NextResponse.json(
        { error: "Erreur service de traduction" },
        { status: 502 }
      );
    }
    const translation = data.responseData?.translatedText?.trim() ?? "";
    return NextResponse.json({ translation });
  } catch (err) {
    console.error("Translate API error:", err);
    return NextResponse.json(
      { error: "Impossible de traduire pour le moment" },
      { status: 502 }
    );
  }
}
