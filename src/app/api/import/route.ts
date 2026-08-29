import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists, words } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { franc } from "franc";
import { parseLinesToItems } from "@/lib/extract";
import { toIso6391 } from "@/lib/language";
import { CLAUDE_MODEL } from "@/lib/ai-model";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Word } from "@/lib/db/schema";
import { syncFamilyNameToList } from "@/lib/user-list";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const API_TIMEOUT_MS = 30_000;

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const SUPPORTED_PDF_TYPE = "application/pdf";

const CLAUDE_SYSTEM_PROMPT = `Extract all foreign language vocabulary words from this image.
Return ONLY a JSON array of objects with this structure:
{ "word": string, "context": string }
- word: the vocabulary word or expression
- context: the sentence or phrase around the word (for disambiguation)
No explanation, no markdown, no code block wrapper, just the raw JSON array.`;

type VocabularyItem = { word: string; context: string };

function parseClaudeVocabularyJson(raw: string): VocabularyItem[] {
  const trimmed = raw.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
    else return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (x): x is VocabularyItem =>
      typeof x === "object" &&
      x !== null &&
      typeof (x as VocabularyItem).word === "string" &&
      (x as VocabularyItem).word.trim().length > 0
  );
}

async function translateToFrench(
  openai: OpenAI,
  term: string,
  sourceLangIso6391: string
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 100,
    messages: [
      {
        role: "system",
        content:
          "Tu es un traducteur. Traduis uniquement le mot ou l'expression donné en français. Pas d'explication, pas de guillemets.",
      },
      {
        role: "user",
        content: `Traduis en français : ${term} (langue source : ${sourceLangIso6391})`,
      },
    ],
  });
  const translation =
    completion.choices[0]?.message?.content?.trim() ?? "";
  return translation || term;
}

async function ensureFamilyAccess(
  familyId: string,
  userId: string
): Promise<typeof wordFamilies.$inferSelect | null> {
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, familyId),
        eq(wordFamilies.userId, userId)
      )
    )
    .limit(1);
  return family ?? null;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante (nécessaire pour l'extraction d'images)" },
      { status: 503 }
    );
  }
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY manquante (nécessaire pour la traduction)" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Corps multipart requis" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const familyId = (formData.get("familyId") as string)?.trim();
  const listName = (formData.get("listName") as string)?.trim();

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Champ 'file' requis avec un fichier" },
      { status: 400 }
    );
  }
  if (!familyId) {
    return NextResponse.json(
      { error: "Champ 'familyId' requis" },
      { status: 400 }
    );
  }
  if (!listName) {
    return NextResponse.json(
      { error: "Champ 'listName' requis" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 10 Mo)" },
      { status: 400 }
    );
  }

  const mime = file.type?.toLowerCase() ?? "";
  const isPdf = mime === SUPPORTED_PDF_TYPE;
  const isImage = SUPPORTED_IMAGE_TYPES.includes(mime);

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: "Format non supporté. Utilise JPG, PNG ou PDF." },
      { status: 400 }
    );
  }

  const family = await ensureFamilyAccess(familyId, user.id);
  if (!family) {
    return NextResponse.json(
      { error: "Liste introuvable" },
      { status: 404 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    let pairs: Array<{ term: string; definition: string }> = [];

    if (isPdf) {
      const { getDocumentProxy, extractText } = await import("unpdf");
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buffer);
      const result = await extractText(pdf, { mergePages: true });
      const raw = result.text as string | string[] | undefined;
      const text =
        typeof raw === "string"
          ? raw
          : Array.isArray(raw)
            ? raw.join("\n")
            : "";
      await pdf.destroy();
      const items = parseLinesToItems(text);
      pairs = items.map((i) => ({
        term: i.term.trim(),
        definition: i.definition.trim(),
      }));
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");

      const anthropic = new Anthropic({ apiKey: anthropicKey });
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
                  media_type: (mime as "image/jpeg" | "image/png") || "image/jpeg",
                  data: base64,
                },
              },
              {
                type: "text",
                text: "Extract all vocabulary words from this image and return the JSON array.",
              },
            ],
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      const raw =
        textContent?.type === "text"
          ? textContent.text
          : "";
      const vocabularyItems = parseClaudeVocabularyJson(raw);

      const sampleForLang = vocabularyItems
        .slice(0, 10)
        .map((v) => v.word)
        .join(" ");
      const detectedLang = franc(sampleForLang, { minLength: 3 });
      const sourceLang =
        detectedLang && detectedLang !== "und"
          ? toIso6391(detectedLang)
          : "en";

      const openai = new OpenAI({ apiKey: openaiKey });
      for (const item of vocabularyItems) {
        const def = await translateToFrench(openai, item.word, sourceLang);
        pairs.push({ term: item.word.trim(), definition: def });
      }
    }

    pairs = pairs.filter((p) => p.term.length > 0);
    if (pairs.length === 0) {
      return NextResponse.json(
        { error: "Aucun mot de vocabulaire extrait" },
        { status: 422 }
      );
    }

    const sampleForLang = pairs.slice(0, 10).map((p) => p.term).join(" ");
    const detectedLang = franc(sampleForLang, { minLength: 3 });
    const sourceLang =
      detectedLang && detectedLang !== "und"
        ? toIso6391(detectedLang)
        : "en";

    const openai = new OpenAI({ apiKey: openaiKey });
    const toInsert: Array<{ term: string; definition: string }> = [];
    for (const p of pairs) {
      const defIsFrench =
        p.definition && franc(p.definition, { minLength: 2 }) === "fra";
      const definition = defIsFrench
        ? p.definition
        : await translateToFrench(openai, p.term, sourceLang);
      toInsert.push({ term: p.term, definition });
    }

    const listId = nanoid();
    await db.insert(lists).values({
      id: listId,
      familyId,
      name: listName,
      source: isPdf ? "pdf" : "ocr",
      language: detectedLang && detectedLang !== "und" ? detectedLang : null,
    });
    await syncFamilyNameToList(familyId, listName);

    const inserted: Array<Word & { id: string; rank: number }> = [];
    for (let i = 0; i < toInsert.length; i++) {
      const id = nanoid();
      await db.insert(words).values({
        id,
        listId,
        term: toInsert[i].term,
        definition: toInsert[i].definition,
        rank: i,
        isExpression: false,
      });
      inserted.push({
        id,
        listId,
        term: toInsert[i].term,
        definition: toInsert[i].definition,
        rank: i,
        isExpression: false,
        createdAt: new Date(),
      });
    }

    clearTimeout(timeout);
    return NextResponse.json({
      imported: inserted.length,
      words: inserted,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return NextResponse.json(
          { error: "Délai dépassé (30 s). Réessaie avec un fichier plus petit." },
          { status: 504 }
        );
      }
      console.error("Import error:", err);
      return NextResponse.json(
        { error: err.message || "Erreur lors de l'import" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de l'import" },
      { status: 500 }
    );
  }
}
