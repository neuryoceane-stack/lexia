import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai-model";
import { parseLinesToItems } from "@/lib/extract";

const CLAUDE_SYSTEM_PROMPT = `Tu es un assistant OCR pour des listes de vocabulaire bilingues.
L'image contient du texte sous forme de listes : mot ou expression dans une langue et sa traduction ou définition dans une autre.

Transcris fidèlement tout le texte lisible. Garde les séparateurs (deux-points, tirets, etc.) et les retours à la ligne.
Réponds uniquement avec le texte brut, sans JSON, sans traduction supplémentaire.`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante (extraction par Claude)" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Fichier image requis" },
      { status: 400 }
    );
  }

  const file = formData.get("file") ?? formData.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Envoyez un fichier image (champ 'file' ou 'image')" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mime = (file.type || "image/jpeg").toLowerCase();
  const mediaType =
    mime === "image/png" ? "image/png" : "image/jpeg";

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: "Transcris fidèlement tout le texte lisible de cette image. Garde les séparateurs et les retours à la ligne.",
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const rawText =
      textContent?.type === "text" ? textContent.text.trim() : "";
    if (!rawText) {
      return NextResponse.json(
        { error: "Aucun texte extrait de l'image" },
        { status: 422 }
      );
    }

    const items = parseLinesToItems(rawText);
    return NextResponse.json({ items });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de l'extraction par Claude";
    console.error("OCR extract error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
