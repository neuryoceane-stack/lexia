/**
 * Pack 6 — Société & débats (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la ley", definition: "loi", type: "" },
  { terme: "las elecciones", definition: "élections", type: "" },
  { terme: "el impuesto", definition: "impôt", type: "" },
  { terme: "la guerra", definition: "guerre", type: "" },
  { terme: "la paz", definition: "paix", type: "" },
  { terme: "la cárcel", definition: "prison", type: "" },
  { terme: "el delito", definition: "infraction", type: "" },
  { terme: "la multitud", definition: "foule", type: "" },
  { terme: "el discurso", definition: "discours", type: "" },
  { terme: "la bandera", definition: "drapeau", type: "" },
  { terme: "el deber", definition: "devoir", type: "" },
  { terme: "la multa", definition: "amende", type: "" },
  { terme: "la prohibición", definition: "interdiction", type: "" },
  { terme: "la encuesta", definition: "sondage", type: "" },
  { terme: "el jurado", definition: "jury", type: "" },
  { terme: "el juez", definition: "juge", type: "" },
  { terme: "el juicio", definition: "procès", type: "" },
  { terme: "el alcalde", definition: "maire", type: "" },
  { terme: "el poder", definition: "pouvoir", type: "" },
  { terme: "las deudas", definition: "dettes", type: "" },
  { terme: "la ayuda social", definition: "aide sociale", type: "" },
  { terme: "la pobreza", definition: "pauvreté", type: "" },
  { terme: "la riqueza", definition: "richesse", type: "" },
  { terme: "el ciudadano", definition: "citoyen", type: "" },
  { terme: "el votante", definition: "électeur", type: "" },
  { terme: "la papeleta", definition: "bulletin de vote", type: "" },
  { terme: "la campaña electoral", definition: "campagne électorale", type: "" },
  { terme: "la democracia", definition: "démocratie", type: "" },
  { terme: "el Congreso", definition: "Congrès des députés, en Espagne", type: "" },
  { terme: "el ministro", definition: "ministre", type: "" },
  { terme: "la desigualdad", definition: "inégalité", type: "" },
  { terme: "el derecho", definition: "droit", type: "" },
  { terme: "la justicia", definition: "justice", type: "" },
  { terme: "la libertad", definition: "liberté", type: "" },
  { terme: "la manifestación", definition: "manifestation", type: "" },
  { terme: "el debate", definition: "débat", type: "" },
  { terme: "la reforma", definition: "réforme", type: "" },
  { terme: "la política", definition: "politique", type: "" },
  { terme: "el refugiado", definition: "personne réfugiée", type: "" },
  { terme: "el asilo", definition: "asile", type: "" },
  { terme: "la diversidad", definition: "diversité", type: "" },
  { terme: "la discriminación", definition: "discrimination", type: "" },
  { terme: "la solidaridad", definition: "solidarité", type: "" },
  { terme: "el compromiso cívico", definition: "engagement civique", type: "" },
  { terme: "la petición", definition: "pétition", type: "" },
  { terme: "el grupo de presión", definition: "groupe de pression", type: "" },
  { terme: "el derecho fundamental", definition: "droit fondamental", type: "" },
  { terme: "la corrupción", definition: "corruption", type: "" },
  { terme: "el soborno", definition: "pot-de-vin", type: "" },
  { terme: "el escándalo", definition: "scandale", type: "" },
  { terme: "el referéndum", definition: "référendum", type: "" },
  { terme: "la coalición", definition: "coalition", type: "" },
  { terme: "la oposición", definition: "opposition", type: "" },
  { terme: "la mayoría", definition: "majorité", type: "" },
  { terme: "la minoría", definition: "minorité", type: "" },
  { terme: "el prejuicio", definition: "préjugé", type: "" },
  { terme: "el suceso", definition: "événement, et non « succès »", type: "" },
  { terme: "la persona sin hogar", definition: "personne sans domicile", type: "" },
  { terme: "los derechos civiles", definition: "droits civiques", type: "" },
  { terme: "los derechos humanos", definition: "droits humains", type: "" },
  { terme: "la participación electoral", definition: "participation électorale", type: "" },
  { terme: "el colegio electoral", definition: "bureau de vote", type: "" },
  { terme: "la igualdad", definition: "égalité", type: "" },
  { terme: "la protesta", definition: "protestation", type: "" },
  { terme: "el problema", definition: "problème (nom masculin)", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "adoptar", definition: "adopter une loi", type: "" },
  { terme: "rebelarse", definition: "se révolter", type: "" },
  { terme: "abogar", definition: "plaider pour", type: "" },
  { terme: "abandonar un partido", definition: "quitter un parti", type: "" },
  { terme: "participar", definition: "participer", type: "" },
  { terme: "ceder", definition: "céder", type: "" },
  { terme: "encabezar", definition: "mener un groupe", type: "" },
  { terme: "marginar", definition: "mettre à l'écart", type: "" },
  { terme: "inmiscuirse", definition: "s'immiscer", type: "" },
  { terme: "unirse", definition: "s'unir", type: "" },
  { terme: "proseguir", definition: "poursuivre", type: "" },
  { terme: "deshacerse de", definition: "se débarrasser de", type: "" },
  { terme: "votar", definition: "voter", type: "" },
  { terme: "convocar", definition: "lancer un appel", type: "" },
  { terme: "pretender", definition: "avoir l'intention de, et non « prétendre »", type: "" },
  // —— 20 expressions ——
  { terme: "dar gato por liebre", definition: "tromper sur la marchandise", type: "expression" },
  { terme: "haber gato encerrado", definition: "avoir anguille sous roche", type: "expression" },
  { terme: "la gota que colma el vaso", definition: "la goutte de trop", type: "expression" },
  { terme: "en boca cerrada no entran moscas", definition: "avoir intérêt à se taire", type: "expression" },
  { terme: "hacer la vista gorda", definition: "fermer les yeux", type: "expression" },
  { terme: "tener la sartén por el mango", definition: "avoir le dessus", type: "expression" },
  { terme: "barrer para casa", definition: "tirer la couverture à soi", type: "expression" },
  { terme: "no dejar títere con cabeza", definition: "ne rien épargner", type: "expression" },
  { terme: "estar en la cuerda floja", definition: "être sur la corde raide", type: "expression" },
  { terme: "lavarse las manos", definition: "s'en laver les mains", type: "expression" },
  { terme: "meter en el mismo saco", definition: "tout mettre dans le même sac", type: "expression" },
  { terme: "ser harina de otro costal", definition: "relever d'une autre histoire", type: "expression" },
  { terme: "tomar cartas en el asunto", definition: "prendre l'affaire en main", type: "expression" },
  { terme: "entre la espada y la pared", definition: "être dos au mur", type: "expression" },
  { terme: "no dar el brazo a torcer", definition: "ne pas céder d'un pouce", type: "expression" },
  { terme: "pagar el pato", definition: "trinquer à la place d'un autre", type: "expression" },
  { terme: "escurrir el bulto", definition: "se dérober", type: "expression" },
  { terme: "sembrar cizaña", definition: "semer la zizanie", type: "expression" },
  { terme: "ser el chivo expiatorio", definition: "servir de bouc émissaire", type: "expression" },
  { terme: "brindis al sol", definition: "promesse en l'air", type: "expression" },
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
