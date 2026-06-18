import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import OpenAI from "openai";

// 60 s = plafond du plan Vercel Hobby. Laisse l'OCR (Claude/PDF scanné) aller au
// bout sans être coupé par le délai par défaut, plus court, de la plateforme.
export const maxDuration = 60;

/** Texte PDF jugé trop court : probable scan image → envoi PDF à Claude (document). */
const MIN_PDF_TEXT_CHARS = 20;

/**
 * Extraction du texte via Claude à partir du PDF brut (base64), sans canvas natif.
 * @see https://docs.anthropic.com/en/docs/build-with-claude/pdf-support
 */
async function claudeExtractTextFromPdfBase64(
  anthropicKey: string,
  base64Pdf: string
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system:
      "Tu es un assistant OCR. Réponds uniquement avec le texte extrait du document, fidèle à l’original, en conservant les retours à la ligne quand c’est pertinent. Aucun commentaire ni préambule.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            type: "text",
            text: "Extrais tout le texte visible dans ce document.",
          },
        ],
      },
    ],
  });
  const textContent = response.content.find((c) => c.type === "text");
  return textContent?.type === "text" ? textContent.text.trim() : "";
}

/**
 * POST /api/extract/raw
 * Body: FormData { file: File, type: "pdf" | "image" }
 * Returns { text: string, usedVisionOcr?: boolean } — texte brut pour Mots sauvages.
 * PDF : unpdf ; si texte &lt; 20 car. → PDF envoyé tel quel à Claude (document base64) si ANTHROPIC_API_KEY.
 * Image : Claude en priorité, OpenAI gpt-4o en fallback.
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
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    try {
      const { getDocumentProxy, extractText } = await import("unpdf");
      const fileBuffer = await file.arrayBuffer();
      const base64Pdf = Buffer.from(fileBuffer).toString("base64");
      const pdfBytes = new Uint8Array(fileBuffer.byteLength);
      pdfBytes.set(new Uint8Array(fileBuffer));
      const pdf = await getDocumentProxy(pdfBytes);
      let usedVisionOcr = false;
      try {
        const result = await extractText(pdf, { mergePages: true });
        const raw = result.text as string | string[] | undefined;
        const extracted =
          typeof raw === "string"
            ? raw
            : Array.isArray(raw)
              ? raw.join("\n")
              : "";
        let text = extracted.trim();

        if (text.length < MIN_PDF_TEXT_CHARS) {
          if (!anthropicKey) {
            return NextResponse.json({
              text,
              usedVisionOcr: false,
            });
          }
          try {
            const ocrText = await claudeExtractTextFromPdfBase64(
              anthropicKey,
              base64Pdf
            );
            if (!ocrText) {
              return NextResponse.json(
                { error: "Réponse vide du service OCR (document PDF)" },
                { status: 502 }
              );
            }
            text = ocrText;
            usedVisionOcr = true;
          } catch (ocrErr) {
            console.error("Extract raw PDF Claude document error:", ocrErr);
            return NextResponse.json(
              {
                error:
                  ocrErr instanceof Error
                    ? ocrErr.message
                    : "Erreur OCR Claude (PDF)",
              },
              { status: 502 }
            );
          }
        }

        return NextResponse.json({ text, usedVisionOcr });
      } finally {
        await pdf.destroy();
      }
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

  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const dataUrl = `data:${mime};base64,${base64}`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
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

  return NextResponse.json(
    { error: "OPENAI_API_KEY ou ANTHROPIC_API_KEY requis pour l'OCR" },
    { status: 503 }
  );
}
