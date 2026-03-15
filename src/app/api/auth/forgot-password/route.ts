import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifie si l'email existe en base
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .get();

    // On répond toujours "ok" pour ne pas révéler si l'email existe
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Génère un token sécurisé
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Stocke le token en base
    await db.insert(passwordResetTokens).values({
      id: randomBytes(16).toString("hex"),
      userId: user.id,
      token,
      expiresAt,
    });

    // Envoie l'email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "Lexiva <noreply@lexiva.app>",
      to: email,
      subject: "Réinitialisation de ton mot de passe Lexiva",
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #6C3FC8; font-size: 28px; margin: 0;">Lexiva</h1>
          </div>
          <h2 style="color: #1a1a1a; font-size: 20px;">Réinitialisation de ton mot de passe</h2>
          <p style="color: #555; line-height: 1.6;">
            Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour en choisir un nouveau.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #6C3FC8; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">
            Ce lien est valable 1 heure. Si tu n'as pas fait cette demande, ignore cet email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
