import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

export const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 jours

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

export async function signToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY_SECONDS}s`)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const sub = payload.sub as string | undefined;
    const email = payload.email as string | undefined;
    const role = (payload.role as string) ?? "etudiant";
    if (!sub || !email) return null;
    return { sub, email, role, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}
