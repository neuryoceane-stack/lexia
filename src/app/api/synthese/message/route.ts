import { NextResponse } from "next/server";

/**
 * POST /api/synthese/message
 * Ancien message motivant généré par Claude. Aucun appel dans l'application.
 * Le fichier est conservé : la route répond 410 au lieu d'appeler le modèle.
 * GET /api/synthese (statistiques) n'est pas concerné.
 */
export function POST() {
  return NextResponse.json(
    { error: "Cette ressource n'est plus disponible." },
    { status: 410 }
  );
}
