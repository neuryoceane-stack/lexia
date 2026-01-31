import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Tesseract from "tesseract.js";
import { parseLinesToItems } from "@/lib/extract";

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
  let text: string;
  try {
    const { data } = await Tesseract.recognize(buffer, "fra+eng", {
      logger: () => {},
    });
    text = data.text;
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la reconnaissance du texte";
    console.error("OCR extract error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  const items = parseLinesToItems(text);
  return NextResponse.json({ items });
}
