import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { passwordResetEmail } from "@/lib/emails/password-reset";
import { logEmailEvent } from "@/lib/email-events";
import { extractErrorMessage } from "@/lib/error-event-utils";

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
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

    const message = passwordResetEmail(resetUrl);
    try {
      const result = await resend.emails.send({
        from: message.from,
        to: email,
        subject: message.subject,
        html: message.html,
      });
      logEmailEvent({
        toEmail: email,
        type: "password_reset",
        status: "sent",
        userId: user.id,
        providerId: result.data?.id ?? null,
      });
    } catch (sendError) {
      logEmailEvent({
        toEmail: email,
        type: "password_reset",
        status: "failed",
        userId: user.id,
        error: extractErrorMessage(sendError),
      });
      throw sendError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
