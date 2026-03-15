import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
    }

    // Vérifie que le token existe, n'est pas expiré et n'a pas déjà été utilisé
    const resetToken = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date()),
        )
      )
      .get();

    if (!resetToken || resetToken.usedAt) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    }

    // Hash le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Met à jour le mot de passe en base
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, resetToken.userId));

    // Invalide le token
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
