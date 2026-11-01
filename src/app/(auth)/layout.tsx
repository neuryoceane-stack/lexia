"use client";

import { FloatingWords } from "@/components/auth/floating-words";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <FloatingWords>{children}</FloatingWords>;
}
