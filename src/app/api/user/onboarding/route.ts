import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(userProfiles)
    .set({ onboardingCompleted: true })
    .where(eq(userProfiles.userId, user.id));

  return NextResponse.json({ success: true });
}

