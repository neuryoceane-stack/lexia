/**
 * Pack 6 — Société & débats (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "il diritto", definition: "droit, au sens juridique", type: "" },
  { terme: "il dovere", definition: "obligation", type: "" },
  { terme: "la legge", definition: "loi", type: "" },
  { terme: "la Costituzione", definition: "constitution", type: "" },
  { terme: "il cittadino", definition: "citoyen", type: "" },
  { terme: "la cittadinanza", definition: "citoyenneté", type: "" },
  { terme: "il voto elettorale", definition: "voix déposée lors d'une élection", type: "" },
  { terme: "l'elezione (f.)", definition: "élection", type: "" },
  { terme: "il candidato", definition: "candidat à une élection", type: "" },
  { terme: "la campagna elettorale", definition: "campagne électorale", type: "" },
  { terme: "il partito", definition: "parti politique", type: "" },
  { terme: "la maggioranza", definition: "majorité", type: "" },
  { terme: "l'opposizione (f.)", definition: "opposition politique", type: "" },
  { terme: "il Parlamento", definition: "parlement", type: "" },
  { terme: "il governo", definition: "gouvernement", type: "" },
  { terme: "il presidente del Consiglio", definition: "chef du gouvernement, en Italie", type: "" },
  { terme: "il sindaco", definition: "maire", type: "" },
  { terme: "il Comune", definition: "commune, la collectivité municipale", type: "" },
  { terme: "la Regione", definition: "région, comme collectivité en Italie", type: "" },
  { terme: "il referendum", definition: "référendum", type: "" },
  { terme: "la scheda elettorale", definition: "bulletin de vote", type: "" },
  { terme: "l'astensione (f.)", definition: "abstention", type: "" },
  { terme: "il sondaggio", definition: "sondage d'opinion", type: "" },
  { terme: "l'opinione (f.)", definition: "opinion", type: "" },
  { terme: "il dibattito", definition: "débat", type: "" },
  { terme: "l'argomento (m.)", definition: "sujet abordé, pas une dispute", type: "" },
  { terme: "il punto di vista", definition: "point de vue", type: "" },
  { terme: "il consenso", definition: "large accord dans l'opinion", type: "" },
  { terme: "il disaccordo", definition: "désaccord", type: "" },
  { terme: "la protesta", definition: "protestation", type: "" },
  { terme: "la manifestazione", definition: "manifestation de rue", type: "" },
  { terme: "lo striscione", definition: "banderole", type: "" },
  { terme: "il corteo", definition: "défilé", type: "" },
  { terme: "la petizione", definition: "pétition", type: "" },
  { terme: "i diritti umani", definition: "droits humains", type: "" },
  { terme: "la libertà d'espressione", definition: "liberté d'expression", type: "" },
  { terme: "l'uguaglianza (f.)", definition: "égalité", type: "" },
  { terme: "la discriminazione", definition: "discrimination", type: "" },
  { terme: "il pregiudizio", definition: "préjugé", type: "" },
  { terme: "lo stereotipo", definition: "stéréotype", type: "" },
  { terme: "la minoranza", definition: "minorité", type: "" },
  { terme: "l'integrazione (f.)", definition: "intégration dans la société", type: "" },
  { terme: "il razzismo", definition: "racisme", type: "" },
  { terme: "la solidarietà", definition: "solidarité", type: "" },
  { terme: "il volontariato", definition: "bénévolat", type: "" },
  { terme: "l'associazione (f.)", definition: "association", type: "" },
  { terme: "la democrazia", definition: "démocratie", type: "" },
  { terme: "la dittatura", definition: "dictature", type: "" },
  { terme: "la giustizia", definition: "justice", type: "" },
  { terme: "il tribunale", definition: "tribunal", type: "" },
  { terme: "il giudice", definition: "juge", type: "" },
  { terme: "l'avvocato (m.)", definition: "avocat", type: "" },
  { terme: "la pena", definition: "sanction prononcée par un tribunal", type: "" },
  { terme: "la multa", definition: "amende", type: "" },
  { terme: "il reato", definition: "infraction", type: "" },
  { terme: "la vittima", definition: "victime", type: "" },
  { terme: "il testimone", definition: "témoin", type: "" },
  { terme: "la prova giudiziaria", definition: "preuve devant un tribunal", type: "" },
  { terme: "la presunzione d'innocenza", definition: "présomption d'innocence", type: "" },
  { terme: "il potere", definition: "pouvoir", type: "" },
  { terme: "la corruzione", definition: "corruption", type: "" },
  { terme: "lo scandalo", definition: "scandale", type: "" },
  { terme: "la riforma", definition: "réforme", type: "" },
  { terme: "il seggio", definition: "bureau de vote", type: "" },
  { terme: "l'affluenza (f.)", definition: "participation à un scrutin", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "votare", definition: "voter", type: "" },
  { terme: "eleggere", definition: "élire", type: "" },
  { terme: "candidarsi", definition: "se porter candidat", type: "" },
  { terme: "astenersi", definition: "s'abstenir de voter", type: "" },
  { terme: "protestare", definition: "protester", type: "" },
  { terme: "manifestare", definition: "défiler pour une cause", type: "" },
  { terme: "firmare una petizione", definition: "signer une pétition", type: "" },
  { terme: "discutere", definition: "débattre d'un sujet", type: "" },
  { terme: "convincere", definition: "convaincre", type: "" },
  { terme: "rispettare la legge", definition: "respecter la loi", type: "" },
  { terme: "violare", definition: "enfreindre une règle", type: "" },
  { terme: "denunciare", definition: "porter plainte", type: "" },
  { terme: "testimoniare", definition: "témoigner", type: "" },
  { terme: "assolvere", definition: "acquitter", type: "" },
  { terme: "condannare", definition: "condamner", type: "" },
  // —— 20 expressions ——
  { terme: "avere voce in capitolo", definition: "avoir son mot à dire", type: "expression" },
  { terme: "due pesi e due misure", definition: "juger avec deux mesures différentes", type: "expression" },
  { terme: "lavarsene le mani", definition: "refuser d'assumer une affaire", type: "expression" },
  { terme: "una voce fuori dal coro", definition: "avis qui s'écarte de celui du groupe", type: "expression" },
  { terme: "gettare benzina sul fuoco", definition: "attiser un conflit", type: "expression" },
  { terme: "dire pane al pane e vino al vino", definition: "appeler les choses par leur nom", type: "expression" },
  { terme: "essere il capro espiatorio", definition: "porter la faute à la place des autres", type: "expression" },
  { terme: "prendere posizione", definition: "choisir publiquement un camp", type: "expression" },
  { terme: "cambiare casacca", definition: "passer dans le camp d'en face", type: "expression" },
  { terme: "la legge è uguale per tutti", definition: "nul n'est au-dessus de la loi", type: "expression" },
  { terme: "chi tace acconsente", definition: "le silence vaut acceptation", type: "expression" },
  { terme: "tendere la mano", definition: "faire un geste pour se rapprocher", type: "expression" },
  { terme: "venire a patti", definition: "accepter un compromis", type: "expression" },
  { terme: "mettere i puntini sulle i", definition: "ne laisser aucune zone floue", type: "expression" },
  { terme: "essere sulla stessa barca", definition: "partager le même sort difficile", type: "expression" },
  { terme: "avere le carte in regola", definition: "satisfaire à toutes les conditions exigées", type: "expression" },
  { terme: "fare la voce grossa", definition: "élever le ton pour impressionner", type: "expression" },
  { terme: "chiudere un occhio", definition: "fermer les yeux sur une faute", type: "expression" },
  { terme: "darsi la zappa sui piedi", definition: "agir contre son propre intérêt", type: "expression" },
  { terme: "fare di ogni erba un fascio", definition: "tout mettre dans le même sac", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-06-societe-debats.xlsx"));
