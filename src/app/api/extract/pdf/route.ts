import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseLinesToItems } from "@/lib/extract";
import { getDocumentProxy, extractText } from "unpdf";

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
      { error: "Fichier PDF requis" },
      { status: 400 }
    );
  }
  const file = formData.get("file") ?? formData.get("pdf");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Envoyez un fichier PDF (champ 'file' ou 'pdf')" },
      { status: 400 }
    );
  }
  const buffer = new Uint8Array(await file.arrayBuffer());
  let text: string;
  try {
    const pdf = await getDocumentProxy(buffer);
    const result = await extractText(pdf, { mergePages: true });
    const raw = result.text as string | string[];
    text =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? raw.join("\n")
          : "";
    await pdf.destroy();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la lecture du PDF";
    console.error("PDF extract error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  const items = parseLinesToItems(text);
  return NextResponse.json({ items });
}
