import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/translate
 * Body: { text: string, sourceLang: string, targetLang: string }
 * Lang: ISO 639-1 (en, fr, es, de, it, ...). Utilise MyMemory (gratuit, sans clé).
 * Returns { translation: string }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
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

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
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
    const translation =
      data.responseData?.translatedText?.trim() ?? "";
    return NextResponse.json({ translation });
  } catch (err) {
    console.error("Translate API error:", err);
    return NextResponse.json(
      { error: "Impossible de traduire pour le moment" },
      { status: 502 }
    );
  }
}
