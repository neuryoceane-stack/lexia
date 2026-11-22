/**
 * Pack 4 — Médias & réseaux sociaux (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Nachrichten", definition: "journal d'information", type: "" },
  { terme: "die Presse", definition: "presse", type: "" },
  { terme: "der Beitrag", definition: "publication sur un réseau", type: "" },
  { terme: "das Gefällt-mir", definition: "marque d'approbation en ligne", type: "" },
  { terme: "der Kommentar", definition: "commentaire", type: "" },
  { terme: "das Video", definition: "vidéo", type: "" },
  { terme: "das Foto", definition: "photo", type: "" },
  { terme: "der Blog", definition: "blog", type: "" },
  { terme: "der Feed", definition: "fil d'actualité", type: "" },
  { terme: "das Benutzerkonto", definition: "compte d'utilisateur", type: "" },
  { terme: "das Passwort", definition: "mot de passe", type: "" },
  { terme: "der Kanal", definition: "chaîne", type: "" },
  { terme: "der Zuschauer", definition: "téléspectateur", type: "" },
  { terme: "der Leser", definition: "lecteur", type: "" },
  { terme: "der Redakteur", definition: "rédacteur", type: "" },
  { terme: "die Schlagzeile", definition: "manchette", type: "" },
  { terme: "der Artikel", definition: "article", type: "" },
  { terme: "das Gerücht", definition: "rumeur", type: "" },
  { terme: "der Klatsch", definition: "potins", type: "" },
  { terme: "der Livestream", definition: "diffusion en direct", type: "" },
  { terme: "der Trend", definition: "tendance", type: "" },
  { terme: "das Meme", definition: "mème", type: "" },
  { terme: "der Hashtag", definition: "mot-dièse", type: "" },
  { terme: "der Abonnent", definition: "abonné", type: "" },
  { terme: "der Download", definition: "téléchargement", type: "" },
  { terme: "das Abo", definition: "abonnement", type: "" },
  { terme: "der Podcast", definition: "podcast", type: "" },
  { terme: "der Spoiler", definition: "révélation qui gâche l'intrigue", type: "" },
  { terme: "der Troll", definition: "provocateur en ligne", type: "" },
  { terme: "die Moderation", definition: "filtrage des commentaires", type: "" },
  { terme: "die Plattform", definition: "plateforme", type: "" },
  { terme: "viral", definition: "qui se répand très vite en ligne", type: "" },
  { terme: "der Influencer", definition: "influenceur", type: "" },
  { terme: "der Algorithmus", definition: "algorithme", type: "" },
  { terme: "die Falschmeldung", definition: "fausse information", type: "" },
  { terme: "die Eilmeldung", definition: "information de dernière minute", type: "" },
  { terme: "die Pressemitteilung", definition: "communiqué de presse", type: "" },
  { terme: "die Ausstrahlung", definition: "diffusion à l'antenne", type: "" },
  { terme: "die Dokumentation", definition: "documentaire", type: "" },
  { terme: "die Zensur", definition: "censure", type: "" },
  { terme: "der Hinweisgeber", definition: "lanceur d'alerte", type: "" },
  { terme: "die Desinformation", definition: "désinformation", type: "" },
  { terme: "die Echokammer", definition: "milieu où l'on n'entend que son camp", type: "" },
  { terme: "das Cybermobbing", definition: "cyberharcèlement", type: "" },
  { terme: "die Datenschutzeinstellungen", definition: "réglages de confidentialité", type: "" },
  { terme: "die Datenpanne", definition: "fuite de données", type: "" },
  { terme: "das Phishing", definition: "hameçonnage", type: "" },
  { terme: "die Bildschirmzeit", definition: "temps passé devant les écrans", type: "" },
  { terme: "das Binge-Watching", definition: "visionnage de nombreux épisodes d'affilée", type: "" },
  { terme: "die Benachrichtigung", definition: "notification", type: "" },
  { terme: "der Klickköder", definition: "titre conçu pour forcer le clic", type: "" },
  { terme: "die Bezahlschranke", definition: "accès réservé aux abonnés payants", type: "" },
  { terme: "der Newsletter", definition: "lettre d'information", type: "" },
  { terme: "der Faktencheck", definition: "vérification des faits", type: "" },
  { terme: "die Bildunterschrift", definition: "légende sous une image", type: "" },
  { terme: "die Untertitel", definition: "sous-titres", type: "" },
  { terme: "der Werbespot", definition: "spot publicitaire", type: "" },
  { terme: "die Reichweite", definition: "nombre de personnes touchées", type: "" },
  { terme: "die Quellenangabe", definition: "mention de la source", type: "" },
  { terme: "die Pressefreiheit", definition: "liberté de la presse", type: "" },
  { terme: "aktuell", definition: "d'actualité (et non « réel »)", type: "" },
  { terme: "die Überschrift", definition: "titre d'un article", type: "" },
  { terme: "der Liveticker", definition: "fil d'informations en continu", type: "" },
  { terme: "die Medien", definition: "médias", type: "" },
  { terme: "der Chat", definition: "discussion instantanée en ligne", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "sich einloggen", definition: "se connecter à un compte", type: "" },
  { terme: "sich ausloggen", definition: "se déconnecter", type: "" },
  { terme: "hochladen", definition: "mettre en ligne", type: "" },
  { terme: "herunterladen", definition: "télécharger", type: "" },
  { terme: "durchscrollen", definition: "faire défiler un fil", type: "" },
  { terme: "einschalten", definition: "mettre un poste en marche", type: "" },
  { terme: "ausschalten", definition: "couper un poste", type: "" },
  { terme: "ausblenden", definition: "masquer un élément", type: "" },
  { terme: "nachlesen", definition: "vérifier une information en la lisant", type: "" },
  { terme: "weiterleiten", definition: "transférer un message", type: "" },
  { terme: "aufdecken", definition: "mettre une affaire au jour", type: "" },
  { terme: "mitreden", definition: "intervenir dans un échange", type: "" },
  { terme: "herunterspielen", definition: "présenter un fait comme moins grave", type: "" },
  { terme: "aufbauschen", definition: "grossir un événement", type: "" },
  { terme: "sich abmelden", definition: "se désinscrire", type: "" },
  // —— 20 expressions ——
  { terme: "sich wie ein Lauffeuer verbreiten", definition: "se répandre à toute vitesse", type: "expression" },
  { terme: "die Katze aus dem Sack lassen", definition: "dévoiler un secret", type: "expression" },
  { terme: "im Rampenlicht stehen", definition: "être au centre de l'attention", type: "expression" },
  { terme: "zwischen den Zeilen lesen", definition: "comprendre ce qui n'est pas écrit", type: "expression" },
  { terme: "von Mund zu Mund gehen", definition: "passer de bouche à oreille", type: "expression" },
  { terme: "druckfrisch sein", definition: "venir de paraître", type: "expression" },
  { terme: "für Schlagzeilen sorgen", definition: "faire la une", type: "expression" },
  { terme: "auf Sendung sein", definition: "être à l'antenne", type: "expression" },
  { terme: "hinter vorgehaltener Hand sagen", definition: "dire une chose de façon confidentielle", type: "expression" },
  { terme: "kein Blatt vor den Mund nehmen", definition: "parler sans détour", type: "expression" },
  { terme: "sich versprechen", definition: "faire un lapsus", type: "expression" },
  { terme: "in aller Munde sein", definition: "être le sujet de toutes les conversations", type: "expression" },
  { terme: "ein Medienrummel", definition: "agitation médiatique", type: "expression" },
  { terme: "unter dem Radar bleiben", definition: "passer inaperçu", type: "expression" },
  { terme: "auf dem Laufenden sein", definition: "être au courant", type: "expression" },
  { terme: "den Faden verlieren", definition: "perdre le fil", type: "expression" },
  { terme: "eine unendliche Geschichte", definition: "une affaire qui n'en finit pas", type: "expression" },
  { terme: "einschlagen wie eine Bombe", definition: "produire un effet retentissant", type: "expression" },
  { terme: "viel Wind um nichts machen", definition: "faire beaucoup de bruit pour rien", type: "expression" },
  { terme: "jemandem ein Ohr abkauen", definition: "parler à quelqu'un sans s'arrêter", type: "expression" },
];

function validate(data) {
  if (data.length !== 100) throw new Error(`Expected 100 rows, got ${data.length}`);
  const terms = new Set();
  for (const row of data) {
    if (!row.terme?.trim() || !row.definition?.trim()) throw new Error(`Empty: ${JSON.stringify(row)}`);
    const key = row.terme.trim().toLowerCase();
    if (terms.has(key)) throw new Error(`Duplicate: ${row.terme}`);
    terms.add(key);
  }
  const words = data.filter((r) => r.type !== "expression").length;
  const expressions = data.filter((r) => r.type === "expression").length;
  if (words !== 80 || expressions !== 20) throw new Error(`words=${words} expressions=${expressions}`);
}

validate(rows);
const ws = XLSX.utils.json_to_sheet(rows, { header: ["terme", "definition", "type"] });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, join(__dirname, "pack-04-medias-reseaux.xlsx"));
