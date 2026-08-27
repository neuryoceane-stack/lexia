import type { Metadata } from "next";
import { ARemplir } from "@/components/ARemplir";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Lexiva",
  description: "Politique de protection des données personnelles du service Lexiva.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>

      <p>
        La présente politique de confidentialité a pour objet de vous informer, en toute
        transparence, sur la manière dont vos données personnelles sont collectées,
        utilisées et protégées lorsque vous utilisez le service Lexiva.
      </p>

      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données personnelles est&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Société&nbsp;:</strong> <ARemplir>société (dénomination sociale)</ARemplir>
          </li>
          <li>
            <strong>Email de contact / DPO&nbsp;:</strong>{" "}
            <ARemplir>email de contact ou DPO</ARemplir>
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <p>
          Dans le cadre de l&apos;utilisation du service, nous sommes amenés à collecter les
          catégories de données suivantes&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Données de compte&nbsp;:</strong> adresse email, mot de passe (stocké
            sous forme hashée), nom et prénom le cas échéant.
          </li>
          <li>
            <strong>Contenu pédagogique&nbsp;:</strong> textes importés, listes de
            vocabulaire, traductions, ainsi que les images associées aux fonctionnalités
            «&nbsp;Mots Sauvages&nbsp;».
          </li>
          <li>
            <strong>Données d&apos;usage&nbsp;:</strong> progression d&apos;apprentissage,
            statistiques de révision, séries de connexion (streak), historique d&apos;activité
            sur la plateforme.
          </li>
          <li>
            <strong>Données de paiement&nbsp;:</strong> les paiements sont traités par Stripe.
            Nous ne stockons pas vos coordonnées bancaires sur nos serveurs.
          </li>
        </ul>

        <h3>Traitement par l&apos;IA (données envoyées à Anthropic / Claude)</h3>
        <p>
          Lorsque vous utilisez la fonctionnalité «&nbsp;Mots Sauvages&nbsp;», les images que
          vous importez sont transmises à notre sous-traitant <strong>Anthropic (Claude)</strong>{" "}
          uniquement afin d&apos;en assurer la reconnaissance et l&apos;extraction du
          vocabulaire pertinent pour votre apprentissage.
        </p>
        <p>
          Anthropic intervient en qualité de sous-traitant au sens du RGPD et est
          contractuellement tenu de traiter ces données exclusivement pour notre compte, dans
          le cadre strictement défini de cette mission, et de ne pas les réutiliser pour son
          propre compte (notamment pour l&apos;entraînement de modèles ou à d&apos;autres fins
          commerciales propres).
        </p>
        <p>
          <strong>Avertissement&nbsp;:</strong> nous vous invitons à ne pas soumettre, dans
          les textes ou images importés, d&apos;informations personnelles, sensibles ou
          confidentielles (identité, coordonnées, données de santé, documents administratifs,
          etc.). Vous demeurez responsable du contenu que vous choisissez d&apos;importer dans
          le service.
        </p>
        <p>
          Anthropic est établi aux États-Unis. Le transfert de vos images vers ce prestataire
          constitue un transfert hors Union européenne, encadré par des clauses contractuelles
          types (CCT) approuvées par la Commission européenne, ou par tout autre mécanisme
          reconnu par le RGPD garantissant un niveau de protection adéquat.
        </p>

        <h3>Espace enseignant et données des élèves</h3>
        <p>
          Si vous êtes élève et que vous rejoignez volontairement une classe via un
          identifiant de classe fourni par votre enseignant, certaines de vos données
          d&apos;apprentissage sont partagées avec cet enseignant afin de lui permettre de
          suivre votre progression pédagogique.
        </p>
        <p>
          Concrètement, l&apos;enseignant peut consulter, pour chaque élève ayant rejoint sa
          classe&nbsp;:
        </p>
        <ul>
          <li>votre progression dans les listes qui lui sont rattachées&nbsp;;</li>
          <li>les listes de vocabulaire qui vous ont été assignées&nbsp;;</li>
          <li>vos statistiques d&apos;avancement (taux de maîtrise, activité de révision, etc.).</li>
        </ul>
        <p>
          L&apos;adhésion à une classe est entièrement volontaire de votre part. Vous pouvez
          retirer cet accès à tout moment en quittant la classe depuis vos paramètres&nbsp;;
          cette action met fin au partage de vos données d&apos;apprentissage avec
          l&apos;enseignant concerné.
        </p>
        <p>
          Autres modalités techniques de l&apos;espace enseignant&nbsp;:{" "}
          <ARemplir>à confirmer selon les fonctionnalités réelles de l&apos;espace prof (ex. : l&apos;enseignant peut-il réinitialiser un mot de passe ? se connecter au nom de l&apos;élève ?)</ARemplir>
        </p>
      </section>

      <section>
        <h2>3. Finalités du traitement</h2>
        <p>Vos données sont traitées pour les finalités suivantes&nbsp;:</p>
        <ul>
          <li>Fourniture et bon fonctionnement du service Lexiva.</li>
          <li>Suivi de votre progression et personnalisation de l&apos;expérience d&apos;apprentissage.</li>
          <li>Création, gestion et sécurisation de votre compte utilisateur.</li>
          <li>Facturation, gestion des abonnements et des achats.</li>
          <li>Amélioration continue du produit, de ses fonctionnalités et de sa fiabilité.</li>
        </ul>
      </section>

      <section>
        <h2>4. Bases légales (RGPD)</h2>
        <p>
          Conformément à l&apos;article 6 du RGPD, le traitement de vos données repose sur
          les bases légales suivantes&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Exécution du contrat&nbsp;:</strong> création de compte, fourniture du
            service, suivi de progression, gestion des abonnements et des achats.
          </li>
          <li>
            <strong>Consentement&nbsp;:</strong> lorsque vous acceptez des cookies non
            essentiels ou lorsque vous nous transmettez volontairement certaines
            informations.
          </li>
          <li>
            <strong>Intérêt légitime&nbsp;:</strong> amélioration du produit, sécurisation
            de la plateforme, prévention de la fraude et statistiques d&apos;usage agrégées.
          </li>
          <li>
            <strong>Obligation légale&nbsp;:</strong> conservation de certaines données à des
            fins comptables, fiscales ou réglementaires.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Sous-traitants et destinataires</h2>
        <p>
          Dans le cadre de l&apos;exploitation du service, vos données peuvent être
          transmises aux sous-traitants suivants, agissant pour notre compte et dans la
          limite strictement nécessaire à leurs missions&nbsp;:
        </p>
        <table>
          <thead>
            <tr>
              <th>Sous-traitant</th>
              <th>Rôle</th>
              <th>Localisation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vercel</td>
              <td>Hébergement</td>
              <td>USA</td>
            </tr>
            <tr>
              <td>Turso</td>
              <td>Base de données</td>
              <td>
                <ARemplir>localisation Turso</ARemplir>
              </td>
            </tr>
            <tr>
              <td>Stripe</td>
              <td>Paiement</td>
              <td>USA / UE</td>
            </tr>
            <tr>
              <td>Anthropic (Claude)</td>
              <td>Analyse d&apos;images pour la reconnaissance de vocabulaire</td>
              <td>USA</td>
            </tr>
            <tr>
              <td>
                <ARemplir>service d&apos;envoi d&apos;emails (nom)</ARemplir>
              </td>
              <td>Envoi d&apos;emails transactionnels</td>
              <td>
                <ARemplir>localisation service d&apos;emails</ARemplir>
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Certains de ces prestataires sont situés en dehors de l&apos;Union européenne. Le cas
          échéant, les transferts de données sont encadrés par des clauses contractuelles
          types (CCT) approuvées par la Commission européenne, ou par tout autre mécanisme
          reconnu par le RGPD garantissant un niveau de protection adéquat.
        </p>
      </section>

      <section>
        <h2>6. Durée de conservation</h2>
        <p>
          Vos données sont conservées pendant la durée strictement nécessaire à la réalisation
          des finalités pour lesquelles elles ont été collectées, conformément aux
          obligations légales applicables.
        </p>
        <p>
          <strong>Principe par défaut&nbsp;:</strong> les données de compte et le contenu
          pédagogique associé sont conservés tant que votre compte reste actif, puis{" "}
          <ARemplir>durée de conservation après inactivité ou clôture</ARemplir>. Vous pouvez
          demander la suppression de votre compte et de vos données à tout moment.
        </p>
        <p>
          Durées détaillées par catégorie&nbsp;: <ARemplir>durées de conservation détaillées</ARemplir>
        </p>
      </section>

      <section>
        <h2>7. Vos droits</h2>
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits
          suivants&nbsp;:
        </p>
        <ul>
          <li>Droit d&apos;accès à vos données personnelles.</li>
          <li>Droit de rectification des données inexactes ou incomplètes.</li>
          <li>Droit à l&apos;effacement («&nbsp;droit à l&apos;oubli&nbsp;»).</li>
          <li>Droit à la limitation du traitement.</li>
          <li>Droit à la portabilité de vos données.</li>
          <li>Droit d&apos;opposition au traitement fondé sur l&apos;intérêt légitime.</li>
          <li>
            Droit de retirer votre consentement à tout moment, lorsque le traitement est
            fondé sur celui-ci, sans affecter la licéité du traitement effectué avant ce
            retrait.
          </li>
        </ul>
        <p>
          Pour exercer vos droits, vous pouvez nous contacter à l&apos;adresse suivante&nbsp;:{" "}
          <ARemplir>email pour l&apos;exercice des droits</ARemplir>.
        </p>
        <p>
          Vous disposez également du droit d&apos;introduire une réclamation auprès de la
          Commission Nationale de l&apos;Informatique et des Libertés (CNIL)&nbsp;:{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            www.cnil.fr
          </a>
          .
        </p>
      </section>

      <section>
        <h2>8. Mineurs</h2>
        <p>
          Le service Lexiva s&apos;adresse principalement à un public majeur (18&nbsp;ans et
          plus). Toutefois, des mineurs peuvent s&apos;inscrire et utiliser la plateforme.
        </p>
        <p>
          Conformément à l&apos;article 8 du RGPD et aux dispositions de la loi Informatique et
          Libertés, pour les utilisateurs de moins de 15&nbsp;ans, le consentement d&apos;un
          titulaire de l&apos;autorité parentale est requis avant la création d&apos;un compte
          et le traitement des données personnelles du mineur.
        </p>
        <p>
          <strong>Principe de minimisation&nbsp;:</strong> pour les utilisateurs mineurs, nous
          ne collectons que les données strictement nécessaires au fonctionnement du service
          (création et gestion du compte, fourniture des fonctionnalités pédagogiques, suivi
          de progression). Nous ne demandons pas de données superflues et n&apos;utilisons pas
          les données des mineurs à des fins incompatible avec cette finalité.
        </p>
        <p>
          Modalités de recueil du consentement parental&nbsp;:{" "}
          <ARemplir>modalités précises de recueil du consentement parental</ARemplir>
        </p>
      </section>

      <section>
        <h2>9. Cookies et traceurs</h2>
        <p>
          Le site utilise des cookies et traceurs pour assurer son fonctionnement (cookies
          essentiels) et, le cas échéant, pour mesurer l&apos;audience et améliorer
          l&apos;expérience utilisateur.
        </p>
        <p>
          Liste exacte des cookies et outils utilisés&nbsp;:{" "}
          <ARemplir>liste exacte des cookies et outils de mesure d&apos;audience</ARemplir>
        </p>
      </section>

      <p className="text-sm text-[#6B6B8A]">
        Dernière mise à jour&nbsp;: <ARemplir>date</ARemplir>
      </p>
    </>
  );
}
