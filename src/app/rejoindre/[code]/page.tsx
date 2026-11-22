import Link from "next/link";
import { getUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { findClassInvite, joinClassByCode } from "@/lib/class-join";
import { classInvitePath } from "@/lib/class-code";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { Logo } from "@/components/logo";

function languageLabel(code: string | null): string | null {
  if (!code) return null;
  const norm = code.trim().toLowerCase();
  return PREFERRED_LANGUAGE_OPTIONS.find((option) => option.value === norm)?.label ?? null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page px-4 py-10">
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center">
        <Logo size="auth" className="mb-6" />
        <div className="w-full rounded-[20px] border border-line bg-surface px-5 py-6 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-surface no-underline"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-surface px-5 text-sm font-medium text-ink no-underline"
    >
      {children}
    </Link>
  );
}

export default async function RejoindrePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const invite = await findClassInvite(decodeURIComponent(code));

  if (!invite) {
    return (
      <Shell>
        <h1 className="m-0 text-center font-heading text-2xl text-ink">Classe introuvable</h1>
        <p className="m-0 mt-3 text-center text-sm leading-relaxed text-muted">
          Ce lien ne correspond à aucune classe. Demande un nouveau lien à ton professeur.
        </p>
        <div className="mt-6">
          <PrimaryLink href="/signup">Créer un compte</PrimaryLink>
        </div>
      </Shell>
    );
  }

  const details = [languageLabel(invite.language), invite.schoolLevel].filter(Boolean).join(" · ");
  const user = await getUser();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(classInvitePath(invite.displayCode))}`;
  const signupHref = `/signup?rejoindre=${encodeURIComponent(invite.displayCode)}`;

  if (!user) {
    return (
      <Shell>
        <p className="m-0 text-center text-xs font-medium uppercase tracking-wide text-muted">
          Invitation
        </p>
        <h1 className="m-0 mt-2 text-center font-heading text-2xl text-ink">
          Rejoins « {invite.title} »
        </h1>
        {details ? <p className="m-0 mt-2 text-center text-sm text-muted">{details}</p> : null}
        <p className="m-0 mt-3 text-center text-sm leading-relaxed text-muted">
          Crée ton compte {BRAND_NAME}, ou connecte-toi. La classe s&apos;ajoute ensuite toute seule.
          Ton professeur valide ta place.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <PrimaryLink href={signupHref}>Créer mon compte</PrimaryLink>
          <SecondaryLink href={loginHref}>J&apos;ai déjà un compte</SecondaryLink>
        </div>
      </Shell>
    );
  }

  if (user.role === "professeur" || user.role === "creator" || user.id === invite.teacherId) {
    const ownClass = user.id === invite.teacherId;
    return (
      <Shell>
        <h1 className="m-0 text-center font-heading text-2xl text-ink">
          {ownClass ? "Votre classe" : "Lien réservé aux élèves"}
        </h1>
        <p className="m-0 mt-3 text-center text-sm leading-relaxed text-muted">
          {ownClass
            ? `« ${invite.title} » est déjà la vôtre. Partagez le lien depuis la page de la classe.`
            : "Ce lien sert aux élèves. Ouvrez-le avec un compte élève pour rejoindre la classe."}
        </p>
        <div className="mt-6">
          {ownClass ? (
            <PrimaryLink href={`/app/professeur/classes/${invite.id}`}>
              Ouvrir la classe
            </PrimaryLink>
          ) : user.role === "creator" ? (
            <PrimaryLink href="/app/creator">Retour à l&apos;espace créateur</PrimaryLink>
          ) : (
            <PrimaryLink href="/app/professeur">Retour à l&apos;espace professeur</PrimaryLink>
          )}
        </div>
      </Shell>
    );
  }

  const outcome = await joinClassByCode(user, invite.displayCode);
  const message = outcome.ok ? outcome.message : outcome.error;
  const library =
    outcome.ok && outcome.status === "accepted" ? "/app/familles" : "/app/parametres#ma-classe";

  return (
    <Shell>
      <p className="m-0 text-center text-xs font-medium uppercase tracking-wide text-muted">
        {invite.title}
      </p>
      <h1 className="m-0 mt-2 text-center font-heading text-2xl text-ink">
        {outcome.ok && outcome.status === "accepted"
          ? "Tu es dans la classe"
          : outcome.ok && outcome.status === "rejected"
            ? "Demande refusée"
            : "Demande envoyée"}
      </h1>
      <p className="m-0 mt-3 text-center text-sm leading-relaxed text-muted">{message}</p>
      <div className="mt-6">
        <PrimaryLink href={library}>
          {outcome.ok && outcome.status === "accepted" ? "Voir mes listes" : "Voir ma classe"}
        </PrimaryLink>
      </div>
    </Shell>
  );
}
