import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { joinClassByCode } from "@/lib/class-join";

/**
 * POST /api/classes/join
 * Un élève rejoint une classe par son code. Body: { identifier: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { identifier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const outcome = await joinClassByCode(user, body.identifier ?? "");
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.httpStatus });
  }

  return NextResponse.json({
    classId: outcome.classId,
    classTitle: outcome.classTitle,
    status: outcome.status,
    already: outcome.already,
    message: outcome.message,
  });
}
