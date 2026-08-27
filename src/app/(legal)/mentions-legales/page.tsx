import type { Metadata } from "next";
import Link from "next/link";
import { ARemplir } from "@/components/ARemplir";

export const metadata: Metadata = {
  title: "Mentions légales — Lexiva",
  description: "Informations légales relatives au site Lexiva.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <h1>Mentions légales</h1>

      <section>
        <h2>1. Éditeur du site</h2>
        <p>
          Conformément aux dispositions des articles 6-III et 19 de la loi n°&nbsp;2004-575
          du 21&nbsp;juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), vous
          trouverez ci-dessous les informations relatives à l&apos;éditeur du site&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Dénomination sociale&nbsp;:</strong> <ARemplir>dénomination sociale</ARemplir>
          </li>
          <li>
            <strong>Forme juridique&nbsp;:</strong> <ARemplir>forme juridique</ARemplir>
          </li>
          <li>
            <strong>Capital social&nbsp;:</strong> <ARemplir>capital social</ARemplir>
          </li>
          <li>
            <strong>Siège social&nbsp;:</strong> <ARemplir>siège social</ARemplir>
          </li>
          <li>
            <strong>SIREN / RCS&nbsp;:</strong> <ARemplir>SIREN / RCS</ARemplir>
          </li>
          <li>
            <strong>N° TVA intracommunautaire&nbsp;:</strong>{" "}
            <ARemplir>N° TVA intracommunautaire</ARemplir>
          </li>
          <li>
            <strong>Directeur de la publication&nbsp;:</strong>{" "}
            <ARemplir>directeur de la publication</ARemplir>
          </li>
          <li>
            <strong>Email de contact&nbsp;:</strong> <ARemplir>email de contact</ARemplir>
          </li>
          <li>
            <strong>Nom du site&nbsp;:</strong> <ARemplir>nom du site (rebrand en cours)</ARemplir>
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Hébergeur</h2>
        <p>
          <ARemplir>à vérifier</ARemplir>
        </p>
        <p>
          Le site est hébergé par&nbsp;:
        </p>
        <p>
          <strong>Vercel Inc.</strong>
          <br />
          340 S Lemon Avenue #4133
          <br />
          Walnut, CA 91789, USA
          <br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            https://vercel.com
          </a>
        </p>
      </section>

      <section>
        <h2>3. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble du contenu présent sur ce site (textes, images, graphismes, logo,
          icônes, sons, logiciels, bases de données, etc.) est protégé par le droit de la
          propriété intellectuelle et demeure la propriété exclusive de l&apos;éditeur ou de
          ses partenaires, sauf mention contraire.
        </p>
        <p>
          La marque, le logo et l&apos;identité visuelle de Lexiva, ainsi que l&apos;ensemble
          des éléments graphiques composant le site, ne peuvent être reproduits, imités ou
          exploités, totalement ou partiellement, sans l&apos;autorisation écrite préalable de
          l&apos;éditeur.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou adaptation de tout
          ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est
          interdite sans autorisation préalable.
        </p>
      </section>

      <section>
        <h2>4. Données personnelles</h2>
        <p>
          Les données personnelles collectées via le site sont traitées conformément au
          Règlement général sur la protection des données (RGPD) et à la loi Informatique et
          Libertés. Pour en savoir plus sur vos droits et sur les modalités de traitement de
          vos données, veuillez consulter notre{" "}
          <Link href="/politique-de-confidentialite">politique de confidentialité</Link>.
        </p>
      </section>

      <section>
        <h2>5. Cookies</h2>
        <p>
          Le site peut utiliser des cookies et autres traceurs afin d&apos;assurer son bon
          fonctionnement et, le cas échéant, de mesurer son audience. Pour plus
          d&apos;informations, veuillez consulter notre{" "}
          <Link href="/politique-de-confidentialite">politique de confidentialité</Link>.
        </p>
      </section>

      <section>
        <h2>6. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige,
          et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
        </p>
      </section>

      <p className="text-sm text-[#6B6B8A]">
        Dernière mise à jour&nbsp;: <ARemplir>date</ARemplir>
      </p>
    </>
  );
}
