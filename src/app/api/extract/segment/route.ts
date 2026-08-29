import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUser } from "@/lib/auth";
import { CLAUDE_MODEL } from "@/lib/ai-model";
import {
  PREFERRED_LANGUAGE_OPTIONS,
} from "@/lib/language";
import { parseClaudeSegmentJson } from "@/lib/parse-claude-segments";

const MAX_INPUT_CHARS = 14_000;

const LANGUAGE_CODES = PREFERRED_LANGUAGE_OPTIONS.map((o) => o.value).join(", ");

const CLAUDE_SYSTEM_PROMPT = `Tu es un assistant linguistique. On te fournit un texte extrait d'un document (PDF, photo, page web).

Découpe ce texte en blocs cohérents : paragraphes, sections, listes ou légendes distinctes. Ne fusionne pas des parties clairement séparées. Ne crée pas de blocs vides.

Pour chaque bloc, détecte la langue principale du contenu.

Codes langue ISO 639-3 autorisés : ${LANGUAGE_CODES}.

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown ni commentaire :
[{ "texte": "...", "langueDetectee": "ita" }, ...]

Conserve le texte original de chaque bloc (sans traduction). L'union des blocs doit couvrir tout le texte pertinent sans omission majeure.`;

/**
 * POST /api/extract/segment
 * Body: { text: string, sourceLang?: string }
 * Returns { blocks: { texte, langueDetectee }[] }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante (segmentation par Claude)" },
      { status: 503 }
    );
  }

  let body: { text?: string; sourceLang?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Le texte à segmenter est requis" },
      { status: 400 }
    );
  }

  const sourceLang = (body.sourceLang ?? "").trim().toLowerCase();
  const sourceHint = PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === sourceLang);
  const truncated = text.length > MAX_INPUT_CHARS;
  const textForModel = truncated
    ? `${text.slice(0, MAX_INPUT_CHARS)}\n\n[… texte tronqué pour l'analyse …]`
    : text;

  const userPrompt =
    `Langue principale attendue (celle à apprendre) : ${
      sourceHint ? `${sourceHint.label} (${sourceHint.value})` : sourceLang || "non précisée"
    }.\n\n` +
    "Segmente le texte suivant en blocs et détecte la langue de chaque bloc :\n\n" +
    textForModel;

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const rawText =
      textContent?.type === "text" ? textContent.text.trim() : "";
    if (!rawText) {
      return NextResponse.json(
        { error: "Réponse vide du modèle" },
        { status: 422 }
      );
    }

    const blocks = parseClaudeSegmentJson(rawText);
    if (blocks.length === 0) {
      return NextResponse.json(
        { error: "Aucun bloc exploitable dans la réponse IA" },
        { status: 422 }
      );
    }

    return NextResponse.json({ blocks, truncated });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la segmentation par Claude";
    console.error("Segment extract error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
