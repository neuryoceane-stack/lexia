import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyMark } from "@/components/empty-mark";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--page)" }}
    >
      <EmptyMark icon={Compass} size={140} />

      <p
        className="mt-6"
        style={{ fontSize: 48, fontWeight: 500, color: "var(--ink)", lineHeight: 1 }}
      >
        404
      </p>

      <h1
        className="mt-4"
        style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)" }}
      >
        Oups, cette page s&apos;est envolée
      </h1>

      <p className="mt-3" style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.5 }}>
        La page que tu cherches n&apos;existe pas ou a été déplacée.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center no-underline transition hover:brightness-95"
        style={{
          background: "var(--ink)",
          color: "var(--surface)",
          borderRadius: 20,
          padding: "12px 24px",
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
