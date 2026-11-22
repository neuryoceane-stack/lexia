/**
 * Pack 3 — Travail & carrière (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "il posto di lavoro", definition: "poste", type: "" },
  { terme: "il capo", definition: "patron", type: "" },
  { terme: "la paga oraria", definition: "salaire horaire", type: "" },
  { terme: "lo stipendio", definition: "salaire mensuel", type: "" },
  { terme: "l'assunzione (f.)", definition: "embauche", type: "" },
  { terme: "il licenziamento", definition: "licenciement", type: "" },
  { terme: "le dimissioni", definition: "départ décidé par le salarié", type: "" },
  { terme: "l'ufficio (m.)", definition: "bureau, la pièce", type: "" },
  { terme: "il turno", definition: "tranche horaire de travail", type: "" },
  { terme: "il gruppo di lavoro", definition: "équipe réunie autour d'un projet", type: "" },
  { terme: "l'incarico (m.)", definition: "mission confiée", type: "" },
  { terme: "la competenza", definition: "compétence professionnelle", type: "" },
  { terme: "la carriera", definition: "carrière", type: "" },
  { terme: "il tirocinante", definition: "stagiaire", type: "" },
  { terme: "l'apprendista (m. o f.)", definition: "apprenti", type: "" },
  { terme: "il superiore", definition: "supérieur hiérarchique", type: "" },
  { terme: "il personale", definition: "personnel d'une entreprise", type: "" },
  { terme: "il collega", definition: "collègue", type: "" },
  { terme: "la riunione", definition: "réunion de travail", type: "" },
  { terme: "la scadenza", definition: "date limite", type: "" },
  { terme: "il premio di produzione", definition: "prime liée aux résultats", type: "" },
  { terme: "la pensione", definition: "retraite", type: "" },
  { terme: "l'annuncio di lavoro (m.)", definition: "offre d'emploi", type: "" },
  { terme: "l'avanzamento di carriera (m.)", definition: "avancement hiérarchique", type: "" },
  { terme: "il contratto di lavoro", definition: "contrat de travail", type: "" },
  { terme: "la busta paga", definition: "bulletin de paie", type: "" },
  { terme: "il datore di lavoro", definition: "employeur", type: "" },
  { terme: "il dipendente", definition: "salarié", type: "" },
  { terme: "lo straordinario", definition: "heure supplémentaire", type: "" },
  { terme: "il tragitto casa-lavoro", definition: "trajet entre le domicile et le travail", type: "" },
  { terme: "il colloquio di lavoro", definition: "entretien d'embauche", type: "" },
  { terme: "il candidato al posto", definition: "personne qui postule à un emploi", type: "" },
  { terme: "la lettera di licenziamento", definition: "lettre qui rompt le contrat", type: "" },
  { terme: "il taglio dei posti", definition: "suppression de postes", type: "" },
  { terme: "il lavoro autonomo", definition: "activité indépendante", type: "" },
  { terme: "la sede", definition: "lieu de travail", type: "" },
  { terme: "la rete di contatti", definition: "réseau professionnel", type: "" },
  { terme: "il burnout", definition: "épuisement professionnel", type: "" },
  { terme: "il carico di lavoro", definition: "charge de travail", type: "" },
  { terme: "il periodo di prova", definition: "période d'essai", type: "" },
  { terme: "il TFR", definition: "part du salaire mise de côté et versée en fin de contrat, en Italie", type: "" },
  { terme: "l'assenza per malattia (f.)", definition: "arrêt maladie déclaré", type: "" },
  { terme: "le ferie", definition: "congés payés", type: "" },
  { terme: "il salario minimo", definition: "salaire minimum", type: "" },
  { terme: "il sindacato", definition: "syndicat", type: "" },
  { terme: "il soffitto di cristallo", definition: "plafond de verre", type: "" },
  { terme: "la tutela dal licenziamento", definition: "protection contre le licenciement", type: "" },
  { terme: "il telelavoro", definition: "télétravail", type: "" },
  { terme: "l'orario flessibile (m.)", definition: "horaires flexibles", type: "" },
  { terme: "il mercato del lavoro", definition: "marché de l'emploi", type: "" },
  { terme: "la conciliazione vita-lavoro", definition: "équilibre entre métier et vie personnelle", type: "" },
  { terme: "la parità salariale", definition: "égalité de rémunération", type: "" },
  { terme: "l'affiancamento (m.)", definition: "prise en main auprès d'un collègue", type: "" },
  { terme: "il selezionatore", definition: "recruteur", type: "" },
  { terme: "la raccomandazione", definition: "appui personnel pour décrocher un emploi", type: "" },
  { terme: "l'impiegato (m.)", definition: "employé de bureau", type: "" },
  { terme: "il part-time", definition: "temps partiel", type: "" },
  { terme: "il tempo pieno", definition: "temps plein", type: "" },
  { terme: "il curriculum", definition: "curriculum vitæ", type: "" },
  { terme: "la lettera di motivazione", definition: "lettre de motivation", type: "" },
  { terme: "la referenza", definition: "attestation rédigée par un ancien employeur", type: "" },
  { terme: "il colloquio di valutazione", definition: "entretien annuel d'évaluation", type: "" },
  { terme: "il tirocinio", definition: "stage en entreprise", type: "" },
  { terme: "lo sciopero", definition: "grève", type: "" },
  { terme: "la scrivania", definition: "bureau, le meuble", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "timbrare il cartellino", definition: "pointer en arrivant", type: "" },
  { terme: "staccare", definition: "finir sa journée de travail", type: "" },
  { terme: "consegnare", definition: "remettre un document", type: "" },
  { terme: "assumersi una responsabilità", definition: "prendre une responsabilité sur soi", type: "" },
  { terme: "mettersi in permesso", definition: "prendre un congé autorisé", type: "" },
  { terme: "prendere servizio", definition: "prendre ses fonctions", type: "" },
  { terme: "sollecitare", definition: "relancer un interlocuteur", type: "" },
  { terme: "avanzare di grado", definition: "monter d'un échelon", type: "" },
  { terme: "dare una mano", definition: "dépanner un collègue", type: "" },
  { terme: "disdire", definition: "annuler un rendez-vous", type: "" },
  { terme: "compilare", definition: "remplir un formulaire", type: "" },
  { terme: "approfondire", definition: "creuser une question", type: "" },
  { terme: "iscriversi", definition: "s'inscrire auprès d'un organisme", type: "" },
  { terme: "recuperare il ritardo", definition: "rattraper un retard de travail", type: "" },
  { terme: "presentare domanda", definition: "déposer un dossier de candidature", type: "" },
  // —— 20 expressions ——
  { terme: "essere messo alla porta", definition: "se faire renvoyer de son emploi", type: "expression" },
  { terme: "prenderci la mano", definition: "finir par maîtriser un geste", type: "expression" },
  { terme: "fare le ore piccole", definition: "veiller jusqu'à très tard", type: "expression" },
  { terme: "essere all'altezza", definition: "se montrer capable de faire face", type: "expression" },
  { terme: "venire al dunque", definition: "en venir à l'essentiel", type: "expression" },
  { terme: "pensare fuori dagli schemi", definition: "sortir des solutions toutes faites", type: "expression" },
  { terme: "essere sul pezzo", definition: "rester pleinement concentré sur ce qu'on fait", type: "expression" },
  { terme: "dietro le quinte", definition: "hors de la vue du public", type: "expression" },
  { terme: "tenere le redini", definition: "garder la direction d'une affaire", type: "expression" },
  { terme: "abbandonare la nave che affonda", definition: "quitter une entreprise déjà condamnée", type: "expression" },
  { terme: "avere troppi ferri al fuoco", definition: "mener trop de choses en même temps", type: "expression" },
  { terme: "essere in ballo", definition: "être partie prenante d'une affaire", type: "expression" },
  { terme: "mangiare il pane a tradimento", definition: "être payé sans fournir le travail attendu", type: "expression" },
  { terme: "tenere un profilo basso", definition: "se faire discret", type: "expression" },
  { terme: "farsi in quattro", definition: "se démener pour rendre service", type: "expression" },
  { terme: "fare il minimo sindacale", definition: "n'en faire que ce que le règlement exige", type: "expression" },
  { terme: "sudare sette camicie", definition: "fournir un effort considérable", type: "expression" },
  { terme: "avere le mani in pasta", definition: "être impliqué dans une affaire", type: "expression" },
  { terme: "passare il testimone", definition: "transmettre une responsabilité à quelqu'un d'autre", type: "expression" },
  { terme: "il gioco non vale la candela", definition: "ne pas valoir l'effort demandé", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-03-travail-carriere.xlsx"));
