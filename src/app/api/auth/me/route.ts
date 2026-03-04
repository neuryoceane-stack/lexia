import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/** Retourne l'utilisateur courant (lu depuis le cookie JWT). */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}
