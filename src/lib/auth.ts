import { cookies } from "next/headers";
import { verifyToken } from "./jwt";

export const AUTH_COOKIE_NAME = "auth-token";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  role: "etudiant" | "professeur";
};

/**
 * Lit le JWT depuis le cookie httpOnly et retourne l'utilisateur courant.
 * Utilisable dans les Server Components et les API routes.
 */
export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    name: undefined,
    role: payload.role === "professeur" ? "professeur" : "etudiant",
  };
}
