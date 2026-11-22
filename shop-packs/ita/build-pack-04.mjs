/**
 * Pack 4 — Médias & réseaux sociaux (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "il social network", definition: "réseau social", type: "" },
  { terme: "il profilo social", definition: "profil public sur un réseau", type: "" },
  { terme: "il post", definition: "publication sur un réseau", type: "" },
  { terme: "la story", definition: "publication qui disparaît au bout de quelques heures", type: "" },
  { terme: "il mi piace", definition: "mention j'aime", type: "" },
  { terme: "il commento", definition: "commentaire", type: "" },
  { terme: "la condivisione", definition: "partage d'une publication", type: "" },
  { terme: "l'hashtag (m.)", definition: "mot-dièse", type: "" },
  { terme: "il follower", definition: "abonné qui suit un compte", type: "" },
  { terme: "l'influencer (m. o f.)", definition: "créateur qui vit de son audience en ligne", type: "" },
  { terme: "la bufala", definition: "fausse information qui circule comme si elle était vraie", type: "" },
  { terme: "la fonte", definition: "source d'une information", type: "" },
  { terme: "il titolo", definition: "titre d'un article", type: "" },
  { terme: "la prima pagina", definition: "une d'un journal", type: "" },
  { terme: "il giornale", definition: "journal", type: "" },
  { terme: "il quotidiano", definition: "quotidien", type: "" },
  { terme: "la rivista", definition: "magazine", type: "" },
  { terme: "il telegiornale", definition: "journal télévisé", type: "" },
  { terme: "il servizio giornalistico", definition: "reportage", type: "" },
  { terme: "la diretta", definition: "diffusion en direct", type: "" },
  { terme: "il podcast", definition: "émission audio à la demande", type: "" },
  { terme: "il canale televisivo", definition: "chaîne de télévision", type: "" },
  { terme: "l'abbonato (m.)", definition: "abonné à un média", type: "" },
  { terme: "la redazione", definition: "rédaction d'un média", type: "" },
  { terme: "il giornalista", definition: "journaliste", type: "" },
  { terme: "la censura", definition: "censure", type: "" },
  { terme: "la libertà di stampa", definition: "liberté de la presse", type: "" },
  { terme: "il titolo acchiappa-clic", definition: "titre piège conçu pour obtenir un clic", type: "" },
  { terme: "l'algoritmo (m.)", definition: "algorithme qui trie les contenus", type: "" },
  { terme: "il feed", definition: "fil d'actualité", type: "" },
  { terme: "la notifica", definition: "notification", type: "" },
  { terme: "il messaggio privato", definition: "message privé", type: "" },
  { terme: "l'account (m.)", definition: "compte en ligne", type: "" },
  { terme: "la password", definition: "mot de passe", type: "" },
  { terme: "il nome utente", definition: "nom d'utilisateur", type: "" },
  { terme: "il blocco di un utente", definition: "interdiction faite à un compte d'interagir", type: "" },
  { terme: "la privacy", definition: "protection des données personnelles", type: "" },
  { terme: "i dati personali", definition: "données personnelles", type: "" },
  { terme: "il consenso al trattamento", definition: "accord donné pour qu'on traite ses données", type: "" },
  { terme: "la pubblicità", definition: "publicité", type: "" },
  { terme: "lo spot", definition: "spot publicitaire", type: "" },
  { terme: "l'audience (f.)", definition: "public touché par un média", type: "" },
  { terme: "lo share", definition: "part d'audience télévisée", type: "" },
  { terme: "la tiratura", definition: "tirage d'un journal", type: "" },
  { terme: "l'inchiesta (f.)", definition: "enquête journalistique", type: "" },
  { terme: "la smentita", definition: "démenti", type: "" },
  { terme: "la rettifica", definition: "rectificatif publié", type: "" },
  { terme: "la citazione", definition: "propos rapporté entre guillemets", type: "" },
  { terme: "l'editoriale (m.)", definition: "éditorial", type: "" },
  { terme: "la cronaca", definition: "rubrique des faits d'actualité", type: "" },
  { terme: "la didascalia", definition: "légende sous une image", type: "" },
  { terme: "la schermata", definition: "capture d'écran", type: "" },
  { terme: "virale", definition: "qui se diffuse très vite en ligne", type: "" },
  { terme: "la disinformazione", definition: "diffusion volontaire de fausses nouvelles", type: "" },
  { terme: "la verifica dei fatti", definition: "vérification des faits", type: "" },
  { terme: "l'anonimato (m.)", definition: "anonymat", type: "" },
  { terme: "il troll", definition: "internaute qui poste pour provoquer", type: "" },
  { terme: "la moderazione", definition: "modération des commentaires", type: "" },
  { terme: "il blog", definition: "blog", type: "" },
  { terme: "il sito di notizie", definition: "site d'information", type: "" },
  { terme: "la pagina iniziale", definition: "page d'accueil d'un site", type: "" },
  { terme: "l'articolo a pagamento (m.)", definition: "article réservé aux abonnés", type: "" },
  { terme: "la rassegna stampa", definition: "revue de presse", type: "" },
  { terme: "il titolone", definition: "manchettes en très gros caractères", type: "" },
  { terme: "l'intervista (f.)", definition: "interview", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "pubblicare", definition: "mettre en ligne", type: "" },
  { terme: "condividere", definition: "relayer une publication", type: "" },
  { terme: "commentare", definition: "laisser un commentaire", type: "" },
  { terme: "iscriversi a un canale", definition: "s'abonner à une chaîne", type: "" },
  { terme: "disiscriversi", definition: "se désabonner", type: "" },
  { terme: "bloccare un utente", definition: "empêcher un compte de vous écrire", type: "" },
  { terme: "segnalare", definition: "signaler un contenu", type: "" },
  { terme: "diventare virale", definition: "se répandre très vite en ligne", type: "" },
  { terme: "smentire", definition: "démentir", type: "" },
  { terme: "citare", definition: "rapporter les paroles de quelqu'un", type: "" },
  { terme: "andare in onda", definition: "passer à l'antenne", type: "" },
  { terme: "fare zapping", definition: "passer d'une chaîne à l'autre", type: "" },
  { terme: "aggiornare il profilo", definition: "mettre à jour son profil", type: "" },
  { terme: "filtrare le notizie", definition: "trier les informations reçues", type: "" },
  { terme: "diffondere", definition: "faire circuler une information", type: "" },
  // —— 20 expressions ——
  { terme: "prendere per oro colato", definition: "croire une information sans la vérifier", type: "expression" },
  { terme: "fare il giro del mondo", definition: "être connu partout", type: "expression" },
  { terme: "non credere ai propri occhi", definition: "peiner à accepter ce qu'on a sous les yeux", type: "expression" },
  { terme: "voci di corridoio", definition: "rumeurs qui circulent sans source claire", type: "expression" },
  { terme: "mettere in giro una voce", definition: "propager une rumeur", type: "expression" },
  { terme: "leggere tra le righe", definition: "saisir ce qui n'est pas dit ouvertement", type: "expression" },
  { terme: "essere sulla bocca di tutti", definition: "occuper toutes les conversations", type: "expression" },
  { terme: "gettare fango su qualcuno", definition: "salir la réputation de quelqu'un", type: "expression" },
  { terme: "lavare i panni sporchi in pubblico", definition: "exposer des conflits privés devant tout le monde", type: "expression" },
  { terme: "non avere peli sulla lingua", definition: "dire les choses sans les édulcorer", type: "expression" },
  { terme: "parlare a vanvera", definition: "dire n'importe quoi", type: "expression" },
  { terme: "prendere fischi per fiaschi", definition: "comprendre de travers", type: "expression" },
  { terme: "fare orecchie da mercante", definition: "faire semblant de ne pas entendre", type: "expression" },
  { terme: "un segreto di Pulcinella", definition: "secret que tout le monde connaît déjà", type: "expression" },
  { terme: "gridare al lupo", definition: "donner l'alerte sans fondement", type: "expression" },
  { terme: "vendere fumo", definition: "faire miroiter des choses qui n'existent pas", type: "expression" },
  { terme: "sotto i riflettori", definition: "exposé à l'attention générale", type: "expression" },
  { terme: "a caratteri cubitali", definition: "annoncé en très gros titres", type: "expression" },
  { terme: "predicare al vento", definition: "parler sans être écouté", type: "expression" },
  { terme: "carta canta", definition: "l'écrit fait foi", type: "expression" },
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
