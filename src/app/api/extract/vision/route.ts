import { NextResponse } from "next/server";

/**
 * POST /api/extract/vision
 * Ancienne extraction OCR par vision. Aucun appel dans l'application.
 * Le fichier est conservé : la route répond 410 au lieu d'appeler le modèle.
 */
export function POST() {
  return NextResponse.json(
    { error: "Cette ressource n'est plus disponible." },
    { status: 410 }
  );
}
