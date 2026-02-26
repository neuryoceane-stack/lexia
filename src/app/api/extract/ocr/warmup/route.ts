import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Tesseract from "tesseract.js";

/** Précharge le worker Tesseract pour que le premier vrai appel OCR soit plus rapide. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const minimalPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    await Tesseract.recognize(minimalPng, "fra", { logger: () => {} });
  } catch {
    // Échec possible ; le module et le worker ont quand même été chargés.
  }
  return NextResponse.json({ ok: true });
}
