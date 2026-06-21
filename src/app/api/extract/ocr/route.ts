import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai-model";
import { parseLinesToItems, type ExtractedItem } from "@/lib/extract";
import { parseClaudeVocabularyJson } from "@/lib/parse-claude-translation";

const CLAUDE_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction de vocabulaire bilingue à partir de photos de livres et de cahiers. L'image contient une liste de vocabulaire : des mots/expressions dans une langue étrangère avec leur traduction.

Ta mission : produire des paires propres { term, definition }, en distinguant le vocabulaire utile du superflu typographique.

GARDE : le mot/expression étranger (term) et sa traduction (definition). Les précisions de sens entre parenthèses (ex. « un pôle (poteau) »). Les synonymes proches reliés par « / » dans un même terme (voir règle SYNONYMES).

RETIRE : la prononciation phonétique entre crochets (ex. [hemisfɪə], [ɜːθ]) — ce sont des symboles de l'alphabet phonétique, jamais du vocabulaire. Les numéros de page et numéros isolés en marge. Les titres de section/chapitre. Les symboles décoratifs (•, ⚠).

SÉPARE EN PLUSIEURS PAIRES (dérivés) : quand une ligne contient un mot ET un mot dérivé reliés par une flèche → (ex. « a pole → polar » avec « un pôle → polaire »), crée deux paires distinctes : { term: a pole, definition: un pôle } ET { term: polar, definition: polaire }.

SÉPARE EN PLUSIEURS PAIRES (variantes factorisées) : quand un « / » relie des variantes qui partagent un mot commun factorisé (ex. « the Arctic / Antarctic Ocean » = « l'Océan arctique / antarctique »), déplie chaque variante en reconstituant le terme complet : { term: the Arctic Ocean, definition: l'Océan arctique } ET { term: the Antarctic Ocean, definition: l'Océan antarctique }.

GARDE GROUPÉ (synonymes) : quand un « / » relie de vrais synonymes interchangeables (ex. « a marsh / a bog / a swamp » = « un marécage »), garde-les dans UNE SEULE paire : { term: a marsh / a bog / a swamp, definition: un marécage }. Ne les sépare pas.

Réponds UNIQUEMENT avec un tableau JSON : [{ "term": "...", "definition": "..." }]. Aucun texte avant ou après, pas de bloc de code markdown.`;

function itemsFromClaudeResponse(rawText: string): ExtractedItem[] {
  try {
    const fromJson = parseClaudeVocabularyJson(rawText);
    if (fromJson.length > 0) return fromJson;
  } catch {
    /* fallback parseLinesToItems ci-dessous */
  }
  return parseLinesToItems(rawText);
}

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
              text: "Analyse cette image de vocabulaire et renvoie le tableau JSON des paires { term, definition }, en suivant les règles.",
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

    const items = itemsFromClaudeResponse(rawText);
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
