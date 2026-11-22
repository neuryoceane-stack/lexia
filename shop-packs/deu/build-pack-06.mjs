/**
 * Pack 6 — Société & débats (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "das Gesetz", definition: "loi", type: "" },
  { terme: "die Wahl", definition: "élection", type: "" },
  { terme: "die Steuer", definition: "impôt", type: "" },
  { terme: "der Krieg", definition: "guerre", type: "" },
  { terme: "der Frieden", definition: "paix", type: "" },
  { terme: "das Gefängnis", definition: "prison", type: "" },
  { terme: "die Straftat", definition: "infraction", type: "" },
  { terme: "die Menschenmenge", definition: "foule", type: "" },
  { terme: "die Rede", definition: "discours", type: "" },
  { terme: "die Fahne", definition: "drapeau", type: "" },
  { terme: "die Pflicht", definition: "devoir", type: "" },
  { terme: "die Geldstrafe", definition: "amende", type: "" },
  { terme: "das Verbot", definition: "interdiction", type: "" },
  { terme: "die Umfrage", definition: "sondage", type: "" },
  { terme: "die Geschworenen", definition: "jurés d'assises", type: "" },
  { terme: "der Richter", definition: "juge", type: "" },
  { terme: "der Prozess", definition: "procès", type: "" },
  { terme: "der Bürgermeister", definition: "maire", type: "" },
  { terme: "die Macht", definition: "pouvoir", type: "" },
  { terme: "die Schulden", definition: "dettes", type: "" },
  { terme: "die Sozialhilfe", definition: "aide sociale", type: "" },
  { terme: "die Armut", definition: "pauvreté", type: "" },
  { terme: "der Reichtum", definition: "richesse", type: "" },
  { terme: "der Bürger", definition: "citoyen", type: "" },
  { terme: "der Wähler", definition: "électeur", type: "" },
  { terme: "der Stimmzettel", definition: "bulletin de vote", type: "" },
  { terme: "der Wahlkampf", definition: "campagne électorale", type: "" },
  { terme: "die Demokratie", definition: "démocratie", type: "" },
  { terme: "der Bundestag", definition: "parlement fédéral allemand", type: "" },
  { terme: "der Minister", definition: "ministre", type: "" },
  { terme: "die Ungleichheit", definition: "inégalité", type: "" },
  { terme: "die Justiz", definition: "institution judiciaire", type: "" },
  { terme: "die Gerechtigkeit", definition: "justice", type: "" },
  { terme: "die Freiheit", definition: "liberté", type: "" },
  { terme: "die Demonstration", definition: "manifestation", type: "" },
  { terme: "die Debatte", definition: "débat", type: "" },
  { terme: "die Reform", definition: "réforme", type: "" },
  { terme: "die Politik", definition: "politique", type: "" },
  { terme: "der Flüchtling", definition: "réfugié", type: "" },
  { terme: "das Asyl", definition: "asile", type: "" },
  { terme: "die Vielfalt", definition: "diversité", type: "" },
  { terme: "die Inklusion", definition: "inclusion", type: "" },
  { terme: "die Diskriminierung", definition: "discrimination", type: "" },
  { terme: "die Solidarität", definition: "solidarité", type: "" },
  { terme: "das Engagement", definition: "engagement", type: "" },
  { terme: "die Petition", definition: "pétition", type: "" },
  { terme: "die Lobby", definition: "groupe de pression", type: "" },
  { terme: "das Grundrecht", definition: "droit fondamental", type: "" },
  { terme: "die Korruption", definition: "corruption", type: "" },
  { terme: "das Schmiergeld", definition: "pot-de-vin", type: "" },
  { terme: "der Skandal", definition: "scandale", type: "" },
  { terme: "der Volksentscheid", definition: "référendum", type: "" },
  { terme: "die Koalition", definition: "coalition", type: "" },
  { terme: "die Opposition", definition: "opposition", type: "" },
  { terme: "die Mehrheit", definition: "majorité", type: "" },
  { terme: "die Minderheit", definition: "minorité", type: "" },
  { terme: "das Vorurteil", definition: "préjugé", type: "" },
  { terme: "das Klischee", definition: "cliché", type: "" },
  { terme: "die Obdachlosigkeit", definition: "situation de sans-abri", type: "" },
  { terme: "die Bürgerrechte", definition: "droits civiques", type: "" },
  { terme: "die Menschenrechte", definition: "droits humains", type: "" },
  { terme: "die Wahlbeteiligung", definition: "participation électorale", type: "" },
  { terme: "das Wahllokal", definition: "bureau de vote", type: "" },
  { terme: "die Gleichstellung", definition: "égalité de traitement", type: "" },
  { terme: "der Protest", definition: "protestation", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "durchsetzen", definition: "faire adopter", type: "" },
  { terme: "aufbegehren", definition: "se révolter", type: "" },
  { terme: "eintreten", definition: "prendre parti pour", type: "" },
  { terme: "austreten", definition: "quitter une organisation", type: "" },
  { terme: "mitmachen", definition: "participer", type: "" },
  { terme: "nachgeben", definition: "céder", type: "" },
  { terme: "vorgehen", definition: "agir contre", type: "" },
  { terme: "anführen", definition: "mener un groupe", type: "" },
  { terme: "ausgrenzen", definition: "mettre à l'écart", type: "" },
  { terme: "sich einmischen", definition: "s'immiscer", type: "" },
  { terme: "sich zusammenschließen", definition: "s'unir", type: "" },
  { terme: "fortsetzen", definition: "poursuivre", type: "" },
  { terme: "loswerden", definition: "se débarrasser", type: "" },
  { terme: "abstimmen", definition: "voter", type: "" },
  { terme: "aufrufen", definition: "lancer un appel", type: "" },
  // —— 20 expressions ——
  { terme: "die da oben", definition: "les dirigeants, vus d'en bas", type: "expression" },
  { terme: "eine rote Linie ziehen", definition: "fixer une limite à ne pas franchir", type: "expression" },
  { terme: "des Teufels Advokat spielen", definition: "défendre une thèse juste pour la tester", type: "expression" },
  { terme: "sich bedeckt halten", definition: "ne pas dévoiler son avis", type: "expression" },
  { terme: "alles beim Alten lassen", definition: "ne rien changer", type: "expression" },
  { terme: "von der Basis kommen", definition: "venir du terrain plutôt que du sommet", type: "expression" },
  { terme: "das Zünglein an der Waage sein", definition: "faire pencher la décision", type: "expression" },
  { terme: "ein Sturm im Wasserglas", definition: "une agitation sans vraie gravité", type: "expression" },
  { terme: "ein heißes Eisen anfassen", definition: "aborder un sujet brûlant", type: "expression" },
  { terme: "auf die schiefe Bahn geraten", definition: "glisser vers des actes illégaux", type: "expression" },
  { terme: "mit zweierlei Maß messen", definition: "juger avec deux poids, deux mesures", type: "expression" },
  { terme: "auf einen Nenner kommen", definition: "trouver un terrain d'entente", type: "expression" },
  { terme: "ein Zankapfel sein", definition: "être l'objet d'une dispute", type: "expression" },
  { terme: "in den sauren Apfel beißen", definition: "se résoudre à une chose désagréable", type: "expression" },
  { terme: "mit den gleichen Waffen kämpfen", definition: "affronter à conditions égales", type: "expression" },
  { terme: "ein Auge zudrücken", definition: "fermer les yeux sur une faute", type: "expression" },
  { terme: "ein Zeichen setzen", definition: "poser un acte qui marque les esprits", type: "expression" },
  { terme: "das Kind beim Namen nennen", definition: "dire les choses clairement", type: "expression" },
  { terme: "Stein und Bein schwören", definition: "jurer ses grands dieux", type: "expression" },
  { terme: "laut werden", definition: "élever la voix pour protester", type: "expression" },
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
