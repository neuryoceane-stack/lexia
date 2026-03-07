import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

const PROTECTED_PATHS = [
  "/app",
  "/dashboard",
  "/library",
  "/review",
  "/import",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!isProtected(pathname)) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, SECRET);
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(AUTH_COOKIE_NAME);
    return res;
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/app/:path*",
    "/dashboard/:path*",
    "/library/:path*",
    "/review/:path*",
    "/import/:path*",
  ],
};
