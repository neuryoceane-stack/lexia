import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import OpenAI from "openai";

/**
 * POST /api/extract/raw
 * Body: FormData { file: File, type: "pdf" | "image" }
 * Returns { text: string } — texte brut pour Mots sauvages (pas de paires term/définition).
 * PDF : unpdf. Image : OpenAI Vision ou Claude (ANTHROPIC_API_KEY).
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Fichier requis" },
      { status: 400 }
    );
  }
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "image"; // "pdf" | "image"

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Envoyez un fichier (champ 'file')" },
      { status: 400 }
    );
  }

  if (type === "pdf") {
    try {
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
      return NextResponse.json({ text: text.trim() });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lecture PDF";
      console.error("Extract raw PDF error:", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // type === "image" (OCR) — OpenAI Vision ou Claude
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mime = (file.type || "image/jpeg").toLowerCase();
  const mediaType = mime === "image/png" ? "image/png" : "image/jpeg";

  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const dataUrl = `data:${mime};base64,${base64}`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant OCR. Retranscris uniquement le texte de l'image, ligne par ligne, sans traduction ni commentaires.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Transcris fidèlement tout le texte lisible de cette image. Garde la ponctuation et les retours à la ligne.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      if (!raw) {
        return NextResponse.json(
          { error: "Réponse vide du service OCR IA" },
          { status: 502 }
        );
      }
      return NextResponse.json({ text: raw });
    } catch (err) {
      console.error("Extract raw Vision OCR error:", err);
      return NextResponse.json(
        { error: "Erreur du service OCR IA" },
        { status: 502 }
      );
    }
  }

  if (anthropicKey) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: "Tu es un assistant OCR. Retranscris uniquement le texte de l'image, ligne par ligne, sans traduction ni commentaires.",
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
                text: "Transcris fidèlement tout le texte lisible de cette image. Garde la ponctuation et les retours à la ligne.",
              },
            ],
          },
        ],
      });
      const textContent = response.content.find((c) => c.type === "text");
      const raw = textContent?.type === "text" ? textContent.text.trim() : "";
      if (!raw) {
        return NextResponse.json(
          { error: "Réponse vide du service OCR" },
          { status: 502 }
        );
      }
      return NextResponse.json({ text: raw });
    } catch (err) {
      console.error("Extract raw Claude OCR error:", err);
      return NextResponse.json(
        { error: "Erreur du service OCR Claude" },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    { error: "OPENAI_API_KEY ou ANTHROPIC_API_KEY requis pour l'OCR" },
    { status: 503 }
  );
}
