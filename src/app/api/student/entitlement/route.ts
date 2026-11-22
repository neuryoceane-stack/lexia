import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getClientStudentEntitlement } from "@/lib/student-entitlement";

export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const entitlement = await getClientStudentEntitlement(user);
  return NextResponse.json(entitlement);
}