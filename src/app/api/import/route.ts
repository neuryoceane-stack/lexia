import { NextResponse } from "next/server";

/**
 * POST /api/import
 * Ancienne route d'import (PDF / image). Aucun appel dans l'application.
 * Le fichier est conservé : la route répond 410 au lieu d'exécuter l'extraction.
 */
export function POST() {
  return NextResponse.json(
    { error: "Cette ressource n'est plus disponible." },
    { status: 410 }
  );
}
