import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStudentId } from "@/lib/creator-students";
import { loadStudentSheet, type Queryable } from "@/lib/creator-students-stats";

export const dynamic = "force-dynamic";

/** Fiche d'un élève. Un professeur ou le créateur répond 404. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!isStudentId(id)) {
    return NextResponse.json({ error: "Élève introuvable." }, { status: 404 });
  }

  try {
    const sheet = await loadStudentSheet(db as Queryable, id, new Date());
    if (!sheet) {
      return NextResponse.json({ error: "Élève introuvable." }, { status: 404 });
    }
    return NextResponse.json(sheet, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[GET /api/creator/students/:id]", error);
    return NextResponse.json({ error: "Impossible de charger la fiche." }, { status: 500 });
  }
}
