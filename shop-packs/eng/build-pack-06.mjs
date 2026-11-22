/**
 * Pack 6 — Société & débats (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "law", definition: "loi", type: "" },
  { terme: "vote", definition: "vote", type: "" },
  { terme: "tax", definition: "impôt", type: "" },
  { terme: "war", definition: "guerre", type: "" },
  { terme: "peace", definition: "paix", type: "" },
  { terme: "jail", definition: "prison", type: "" },
  { terme: "crime", definition: "crime", type: "" },
  { terme: "crowd", definition: "foule", type: "" },
  { terme: "speech", definition: "discours", type: "" },
  { terme: "flag", definition: "drapeau", type: "" },
  { terme: "duty", definition: "devoir", type: "" },
  { terme: "fine", definition: "amende", type: "" },
  { terme: "ban", definition: "interdiction", type: "" },
  { terme: "poll", definition: "sondage", type: "" },
  { terme: "jury", definition: "jury", type: "" },
  { terme: "judge", definition: "juge", type: "" },
  { terme: "trial", definition: "procès", type: "" },
  { terme: "mayor", definition: "maire", type: "" },
  { terme: "power", definition: "pouvoir", type: "" },
  { terme: "debt", definition: "dette", type: "" },
  { terme: "aid", definition: "aide", type: "" },
  { terme: "poverty", definition: "pauvreté", type: "" },
  { terme: "wealth", definition: "richesse", type: "" },
  { terme: "citizen", definition: "citoyen", type: "" },
  { terme: "voter", definition: "électeur", type: "" },
  { terme: "ballot", definition: "bulletin de vote", type: "" },
  { terme: "election", definition: "élection", type: "" },
  { terme: "campaign", definition: "campagne électorale", type: "" },
  { terme: "democracy", definition: "démocratie", type: "" },
  { terme: "parliament", definition: "parlement", type: "" },
  { terme: "minister", definition: "ministre", type: "" },
  { terme: "welfare", definition: "aide sociale", type: "" },
  { terme: "inequality", definition: "inégalité", type: "" },
  { terme: "justice", definition: "justice", type: "" },
  { terme: "freedom", definition: "liberté", type: "" },
  { terme: "protest", definition: "manifestation", type: "" },
  { terme: "debate", definition: "débat", type: "" },
  { terme: "reform", definition: "réforme", type: "" },
  { terme: "policy", definition: "politique publique", type: "" },
  { terme: "refugee", definition: "réfugié", type: "" },
  { terme: "asylum", definition: "asile", type: "" },
  { terme: "diversity", definition: "diversité", type: "" },
  { terme: "inclusion", definition: "inclusion", type: "" },
  { terme: "discrimination", definition: "discrimination", type: "" },
  { terme: "solidarity", definition: "solidarité", type: "" },
  { terme: "activism", definition: "militantisme", type: "" },
  { terme: "petition", definition: "pétition", type: "" },
  { terme: "lobby", definition: "groupe de pression", type: "" },
  { terme: "right", definition: "droit", type: "" },
  { terme: "corruption", definition: "corruption", type: "" },
  { terme: "bribery", definition: "corruption active", type: "" },
  { terme: "scandal", definition: "scandale", type: "" },
  { terme: "referendum", definition: "référendum", type: "" },
  { terme: "coalition", definition: "coalition", type: "" },
  { terme: "opposition", definition: "opposition", type: "" },
  { terme: "majority", definition: "majorité", type: "" },
  { terme: "minority", definition: "minorité", type: "" },
  { terme: "prejudice", definition: "préjugé", type: "" },
  { terme: "stereotype", definition: "stéréotype", type: "" },
  { terme: "homelessness", definition: "sans-abrisme", type: "" },
  { terme: "civil rights", definition: "droits civiques", type: "" },
  { terme: "human rights", definition: "droits humains", type: "" },
  { terme: "turnout", definition: "taux de participation", type: "" },
  { terme: "gender gap", definition: "écart entre les sexes", type: "" },
  { terme: "speak up", definition: "prendre la parole", type: "" },
  { terme: "stand up for", definition: "défendre", type: "" },
  { terme: "break out", definition: "éclater", type: "" },
  { terme: "crack down on", definition: "réprimer", type: "" },
  { terme: "root out", definition: "éradiquer", type: "" },
  { terme: "reach out", definition: "tendre la main", type: "" },
  { terme: "back down", definition: "céder", type: "" },
  { terme: "give in", definition: "céder", type: "" },
  { terme: "stand for", definition: "représenter", type: "" },
  { terme: "call for", definition: "réclamer", type: "" },
  { terme: "speak out against", definition: "s'élever contre", type: "" },
  { terme: "join in", definition: "participer", type: "" },
  { terme: "take part", definition: "prendre part", type: "" },
  { terme: "sign up", definition: "s'engager", type: "" },
  { terme: "vote down", definition: "rejeter au vote", type: "" },
  { terme: "rule out", definition: "écarter", type: "" },
  { terme: "the powers that be", definition: "les autorités", type: "expression" },
  { terme: "a heated debate", definition: "un débat houleux", type: "expression" },
  { terme: "draw the line", definition: "fixer une limite", type: "expression" },
  { terme: "play devil's advocate", definition: "prêter le flanc au débat", type: "expression" },
  { terme: "on both sides", definition: "des deux côtés", type: "expression" },
  { terme: "the status quo", definition: "l'état des lieux actuel", type: "expression" },
  { terme: "grassroots", definition: "de la base", type: "expression" },
  { terme: "tip the balance", definition: "faire pencher la balance", type: "expression" },
  { terme: "a storm in a teacup", definition: "une tempête dans un verre d'eau", type: "expression" },
  { terme: "the elephant in the room", definition: "le sujet tabou", type: "expression" },
  { terme: "slippery slope", definition: "pente glissante", type: "expression" },
  { terme: "double standards", definition: "deux poids, deux mesures", type: "expression" },
  { terme: "raise awareness", definition: "sensibiliser", type: "expression" },
  { terme: "common ground", definition: "terrain d'entente", type: "expression" },
  { terme: "a bone of contention", definition: "un sujet de discorde", type: "expression" },
  { terme: "voice an opinion", definition: "exprimer un avis", type: "expression" },
  { terme: "in the public eye", definition: "sous le feu des projecteurs", type: "expression" },
  { terme: "push for change", definition: "plaider pour le changement", type: "expression" },
  { terme: "turn a blind eye", definition: "fermer les yeux", type: "expression" },
  { terme: "make ends meet", definition: "joindre les deux bouts", type: "expression" },
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