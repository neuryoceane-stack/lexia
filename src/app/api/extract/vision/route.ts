import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import type { ExtractedItem } from "@/lib/extract";

const VISION_SYSTEM_PROMPT = `Tu es un assistant qui extrait des listes de vocabulaire à partir d'images.
L'image peut contenir du texte sous forme de listes bilingues : mot ou expression dans une langue (langue 1) et sa traduction ou définition dans une autre langue (langue 2).

Extrais TOUTES les paires mot/traduction visibles. Pour chaque paire :
- term : le mot ou l'expression dans la langue source (langue 1)
- definition : la traduction ou la définition dans la langue cible (langue 2)

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour, de la forme :
{"items":[{"term":"...","definition":"..."},{"term":"...","definition":"..."},...]}

Si tu ne vois aucune liste de vocabulaire, renvoie : {"items":[]}`;

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
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrais toutes les paires vocabulaire (terme / traduction) de cette image. Réponds uniquement en JSON : {\"items\":[{\"term\":\"...\",\"definition\":\"...\"}, ...]}",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Réponse vide du modèle" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(raw) as { items?: unknown };
    const items: ExtractedItem[] = Array.isArray(parsed?.items)
      ? (parsed.items as Array<{ term?: string; definition?: string }>)
          .filter(
            (x) =>
              x &&
              typeof x.term === "string" &&
              typeof x.definition === "string"
          )
          .map((x) => ({
            term: String(x.term).trim(),
            definition: String(x.definition).trim(),
          }))
          .filter((x) => x.term.length > 0)
      : [];

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Réponse du modèle invalide (JSON attendu)" },
        { status: 502 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'extraction par IA";
    console.error("Vision extract error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
