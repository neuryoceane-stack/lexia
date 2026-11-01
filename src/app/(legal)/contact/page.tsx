import type { Metadata } from "next";
import { ARemplir } from "@/components/ARemplir";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Contact — ${BRAND_NAME}`,
  description: `Contactez l'équipe ${BRAND_NAME}.`,
};

export default function ContactPage() {
  return (
    <>
      <h1>Contact</h1>

      <p>
        Vous avez une question sur {BRAND_NAME}, sur votre compte ou sur nos services&nbsp;? Notre
        équipe est à votre disposition. N&apos;hésitez pas à nous écrire, nous vous répondrons
        dans les meilleurs délais.
      </p>

      <section>
        <h2>Email</h2>
        <p>
          Pour toute demande, contactez-nous à l&apos;adresse suivante&nbsp;:
        </p>
        <p className="text-lg">
          <ARemplir>email de contact</ARemplir>
        </p>
      </section>
    </>
  );
}
