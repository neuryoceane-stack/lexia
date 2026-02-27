import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

/**
 * POST /api/extract/raw
 * Body: FormData { file: File, type: "pdf" | "image", ocrLang?: string }
 * Returns { text: string } — texte brut pour Mots sauvages (pas de paires term/définition).
 * Tesseract et unpdf sont importés dynamiquement pour éviter de bloquer le démarrage du serveur.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
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
  const ocrLang = (formData.get("ocrLang") as string)?.trim() || "fra+eng";

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

  // type === "image" (OCR)
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  // 1) Si possible, utiliser OpenAI Vision pour une transcription plus propre du texte.
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mime = file.type || "image/jpeg";
      const dataUrl = `data:${mime};base64,${base64}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant OCR. Tu dois uniquement retranscrire le texte de l'image, ligne par ligne, sans le traduire et sans ajouter de commentaires.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Transcris fidèlement tout le texte lisible de cette image. " +
                  "Garde la ponctuation et les retours à la ligne pour que le texte soit confortable à lire.",
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
      // Pas de fallback silencieux : on renvoie une erreur explicite.
      return NextResponse.json(
        { error: "Erreur du service OCR IA" },
        { status: 502 }
      );
    }
  }

  // 2) Fallback sans clé : Tesseract classique.
  try {
    const Tesseract = (await import("tesseract.js")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data } = await Tesseract.recognize(buffer, ocrLang, {
      logger: () => {},
    });
    return NextResponse.json({ text: (data.text || "").trim() });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur reconnaissance de texte";
    console.error("Extract raw OCR error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
