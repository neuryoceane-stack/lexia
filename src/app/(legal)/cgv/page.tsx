import type { Metadata } from "next";
import Link from "next/link";
import { ARemplir } from "@/components/ARemplir";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Lexiva",
  description: "Conditions générales de vente du service Lexiva.",
};

export default function CgvPage() {
  return (
    <>
      <div className="mb-8 rounded-xl border border-[#F5A623]/40 bg-[#FEF8EC] px-5 py-4 text-sm leading-relaxed text-[#3D3655]">
        <ARemplir>à faire relire par un juriste avant mise en production</ARemplir>
      </div>

      <h1>Conditions Générales de Vente</h1>

      <p>
        Les présentes Conditions Générales de Vente (ci-après «&nbsp;CGV&nbsp;») régissent
        les ventes de produits et services numériques proposés sur le site Lexiva. En
        passant commande, vous reconnaissez avoir pris connaissance des présentes CGV et
        les accepter sans réserve.
      </p>

      <section>
        <h2>1. Identité du vendeur</h2>
        <p>Le vendeur est&nbsp;:</p>
        <ul>
          <li>
            <strong>Société&nbsp;:</strong> <ARemplir>société (dénomination sociale)</ARemplir>
          </li>
          <li>
            <strong>Coordonnées&nbsp;:</strong> <ARemplir>adresse et coordonnées du vendeur</ARemplir>
          </li>
        </ul>
        <p>
          Pour les informations légales complémentaires, veuillez consulter nos{" "}
          <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </section>

      <section>
        <h2>2. Produits et services proposés</h2>
        <p>Lexiva propose notamment&nbsp;:</p>
        <ul>
          <li>
            <strong>Un abonnement</strong> donnant accès aux fonctionnalités premium du
            service, incluant un essai gratuit d&apos;une durée d&apos;un (1) mois, sauf
            mention contraire au moment de la souscription.
          </li>
          <li>
            <strong>Des packs de listes de vocabulaire</strong> vendus à l&apos;unité via le
            LexiShop, en achat ponctuel (one-shot), sans reconduction automatique.
          </li>
        </ul>
        <p>
          Les caractéristiques essentielles de chaque offre sont présentées sur le site au
          moment de la commande.
        </p>
      </section>

      <section>
        <h2>3. Prix</h2>
        <p>
          Les prix des abonnements et des packs sont indiqués en euros (€) et s&apos;entendent{" "}
          <ARemplir>montants TTC ou HT + précision TVA</ARemplir>.
        </p>
        <p>
          Montants applicables&nbsp;: <ARemplir>montants des abonnements et des packs</ARemplir>
        </p>
        <p>
          La TVA applicable est celle en vigueur au jour de la commande. Lexiva se réserve
          le droit de modifier ses tarifs à l&apos;avenir ; le prix applicable reste celui
          affiché au moment de la validation de votre commande.
        </p>
      </section>

      <section>
        <h2>4. Commande et paiement</h2>
        <p>
          Le paiement s&apos;effectue en ligne, de manière sécurisée, via la plateforme Stripe.
          Lexiva ne conserve pas vos coordonnées bancaires.
        </p>
        <p>Le tunnel de commande se déroule comme suit&nbsp;:</p>
        <ol>
          <li>Sélection de l&apos;offre (abonnement ou pack) sur le site.</li>
          <li>Redirection vers la page de paiement sécurisée Stripe.</li>
          <li>Saisie et validation de vos informations de paiement.</li>
          <li>Confirmation de la commande et activation immédiate de l&apos;accès au contenu numérique.</li>
        </ol>
        <p>
          La commande n&apos;est définitivement validée qu&apos;après acceptation du paiement
          par Stripe et confirmation de la transaction.
        </p>
      </section>

      <section>
        <h2>5. Codes d&apos;accès offerts</h2>
        <p>
          Lexiva peut, à titre exceptionnel, mettre à disposition des codes d&apos;accès
          spéciaux permettant de bénéficier du service ou de certaines fonctionnalités sans
          paiement (comptes offerts). L&apos;utilisation de ces codes est soumise aux
          conditions communiquées lors de leur attribution et ne confère aucun droit au-delà
          de ce qui y est expressément prévu.
        </p>
      </section>

      <section>
        <h2>6. Droit de rétractation</h2>
        <p>
          Conformément aux articles L221-18 et suivants du Code de la consommation, vous
          disposez d&apos;un délai de quatorze (14) jours à compter de la conclusion du
          contrat pour exercer votre droit de rétractation, sans avoir à motiver votre
          décision.
        </p>
        <p>
          Toutefois, conformément à l&apos;article L221-28 du Code de la consommation, le
          droit de rétractation ne peut être exercé pour les contenus numériques fournis sur
          un support immatériel dont l&apos;exécution a commencé avec votre accord préalable
          exprès et votre renonciation expresse au droit de rétractation.
        </p>
        <p>
          <strong>Renonciation expresse au droit de rétractation&nbsp;:</strong> en validant
          votre commande et en accédant immédiatement au contenu ou au service numérique
          (abonnement, pack de vocabulaire, fonctionnalités premium), vous demandez
          expressément la fourniture immédiate du contenu numérique et reconnaissez renoncer
          à votre droit de rétractation dès lors que l&apos;accès au service vous est
          effectivement ouvert. Cette renonciation est recueillie au moment de la validation
          de votre commande, avant le début de l&apos;exécution du contrat.
        </p>
        <p>
          Pour exercer votre droit de rétractation lorsque celui-ci reste applicable, vous
          pouvez nous adresser votre demande à&nbsp;:{" "}
          <ARemplir>email pour rétractation</ARemplir>.
        </p>
      </section>

      <section>
        <h2>7. Abonnement</h2>
        <h3>Durée et reconduction</h3>
        <p>
          L&apos;abonnement est souscrit pour la durée indiquée au moment de la souscription
          (mensuelle ou annuelle). Sauf résiliation de votre part, il est reconduit
          tacitement pour une durée identique à l&apos;échéance de la période en cours.
        </p>
        <h3>Essai gratuit</h3>
        <p>
          Lorsqu&apos;un essai gratuit d&apos;un (1) mois est proposé, vous ne serez débité
          qu&apos;à l&apos;issue de cette période, sauf résiliation préalable. Les conditions
          précises de l&apos;essai sont rappelées au moment de la souscription.
        </p>
        <h3>Résiliation</h3>
        <p>
          Vous pouvez résilier votre abonnement à tout moment depuis votre espace personnel
          ou en nous contactant à&nbsp;:{" "}
          <ARemplir>email pour résiliation d&apos;abonnement</ARemplir>. La résiliation prend
          effet à la fin de la période d&apos;abonnement en cours ; aucun remboursement au
          prorata n&apos;est effectué pour la période déjà commencée, sauf disposition légale
          contraire.
        </p>
      </section>

      <section>
        <h2>8. Responsabilité et disponibilité du service</h2>
        <p>
          Lexiva s&apos;efforce d&apos;assurer la disponibilité et la fiabilité du service,
          24&nbsp;heures sur 24 et 7&nbsp;jours sur 7, sous réserve des opérations de
          maintenance et des cas de force majeure. Lexiva ne saurait être tenue responsable
          des interruptions temporaires du service.
        </p>
        <p>
          Lexiva ne pourra être tenue responsable des dommages indirects résultant de
          l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le service. La
          responsabilité de Lexiva est, en tout état de cause, limitée au montant payé par le
          client au titre de la commande concernée.
        </p>
        <p>
          Pour toute réclamation, veuillez nous contacter à&nbsp;:{" "}
          <ARemplir>email pour réclamations</ARemplir>. Nous nous engageons à accuser réception
          de votre demande dans les meilleurs délais.
        </p>
      </section>

      <section>
        <h2>9. Médiation de la consommation</h2>
        <p>
          Conformément aux articles L612-1 et suivants du Code de la consommation, en cas de
          litige non résolu amiablement, vous pouvez recourir gratuitement à un médiateur de
          la consommation.
        </p>
        <p>
          Médiateur compétent&nbsp;:{" "}
          <ARemplir>nom et coordonnées du médiateur de la consommation</ARemplir>
        </p>
        <p>
          Vous pouvez également utiliser la plateforme européenne de règlement en ligne des
          litiges&nbsp;:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </section>

      <section>
        <h2>10. Droit applicable</h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige, et à défaut de
          résolution amiable, les tribunaux français seront seuls compétents, sous réserve
          des dispositions légales impératives applicables aux consommateurs.
        </p>
      </section>

      <p className="text-sm text-[#6B6B8A]">
        Dernière mise à jour&nbsp;: <ARemplir>date</ARemplir>
      </p>
    </>
  );
}
