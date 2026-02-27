import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import type { ExtractedItem } from "@/lib/extract";

const VISION_OCR_PROMPT = `Tu es un assistant OCR spécialisé pour des listes de vocabulaire.
L'image contient du texte sous forme de listes bilingues : mot ou expression dans une langue (langue 1) et sa traduction ou définition dans une autre langue (langue 2).

Ta mission est UNIQUEMENT de TRANSCRIRE le texte lisible, sans traduire et sans le restructurer.

Consignes très importantes :
- Garde les séparateurs visibles tels quels :
  - Les deux-points ":" entre le mot et sa traduction (très important).
  - Les tirets "-", "–", "—" s'ils sont utilisés comme séparateurs.
- Ne réécris PAS le texte, ne le simplifies pas, ne le traduis pas.
- Ne change pas l'ordre des lignes : garde les lignes dans le même ordre que sur l'image.
- Ne produis PAS de JSON, pas de liste clé/valeur, pas de commentaires.

Tu dois répondre UNIQUEMENT avec le texte brut, tel que tu le lis, en conservant les retours à la ligne.`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Extraction par IA non configurée (OPENAI_API_KEY manquante)" },
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
  const mime = file.type || "image/jpeg";
  const dataUrl = `data:${mime};base64,${base64}`;

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [
        { role: "system", content: VISION_OCR_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Transcris fidèlement tout le texte lisible de cette image. " +
                "Garde les caractères de séparation (deux-points ':' , tirets, etc.) et les retours à la ligne. " +
                "Réponds uniquement avec le texte brut, sans traduction et sans commentaires.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    });

    const rawText = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!rawText) {
      return NextResponse.json(
        { error: "Réponse vide du modèle" },
        { status: 502 }
      );
    }

    const items = extractPairsFromRawText(rawText);
    return NextResponse.json({ items });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'extraction par IA";
    console.error("Vision extract error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function stripListPrefix(line: string): string {
  return line
    .replace(/^\s*[•·*]\s*/, "")
    .replace(/^\s*[-–—]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .trim();
}

function isTitleLike(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return true;
  if (trimmed.length > 120) return true;
  const words = trimmed.split(/\s+/);
  if (words.length > 10) return true;
  const upper = trimmed === trimmed.toUpperCase();
  if (upper && words.length <= 6) return true;
  if (/^(unit|lesson|chapitre|chapter|vocabulaire|vocabulary|english|french|anglais|français)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

function extractPairsFromRawText(rawText: string): ExtractedItem[] {
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const items: ExtractedItem[] = [];

  for (const line of lines) {
    const raw = line.trim();
    if (!raw) continue;
    if (!raw.includes(":")) continue;

    const [left, right] = raw.split(":", 2);
    let term = stripListPrefix(left || "");
    let definition = stripListPrefix(right || "");

    if (!term || !definition) continue;
    if (isTitleLike(term) || isTitleLike(definition)) continue;
    if (term.length > 80 || definition.length > 200) continue;

    items.push({ term, definition });
  }

  return items;
}
