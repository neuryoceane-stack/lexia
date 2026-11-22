/**
 * Pack 5 — Santé & corps (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el dolor", definition: "douleur", type: "" },
  { terme: "la fiebre", definition: "fièvre", type: "" },
  { terme: "la tos", definition: "toux", type: "" },
  { terme: "el constipado", definition: "rhume (estar constipado : être enrhumé, et non « constipé »)", type: "" },
  { terme: "la gripe", definition: "grippe", type: "" },
  { terme: "la herida", definition: "plaie", type: "" },
  { terme: "el hueso", definition: "os", type: "" },
  { terme: "el músculo", definition: "muscle", type: "" },
  { terme: "la piel", definition: "peau", type: "" },
  { terme: "la sangre", definition: "sang", type: "" },
  { terme: "el corazón", definition: "cœur", type: "" },
  { terme: "el pulmón", definition: "poumon", type: "" },
  { terme: "el comprimido", definition: "comprimé", type: "" },
  { terme: "la dosis", definition: "dose", type: "" },
  { terme: "el enfermero", definition: "infirmier, infirmière", type: "" },
  { terme: "el médico", definition: "médecin", type: "" },
  { terme: "el paciente", definition: "patient", type: "" },
  { terme: "la consulta", definition: "cabinet médical", type: "" },
  { terme: "la planta hospitalaria", definition: "service d'hospitalisation", type: "" },
  { terme: "la operación", definition: "opération chirurgicale", type: "" },
  { terme: "la radiografía", definition: "radiographie", type: "" },
  { terme: "la vacuna", definition: "vaccin", type: "" },
  { terme: "la alergia", definition: "allergie", type: "" },
  { terme: "el asma", definition: "asthme (nom féminin)", type: "" },
  { terme: "el sarpullido", definition: "éruption cutanée", type: "" },
  { terme: "el pulso", definition: "pouls", type: "" },
  { terme: "el aliento", definition: "souffle", type: "" },
  { terme: "la alimentación", definition: "alimentation", type: "" },
  { terme: "el sueño", definition: "sommeil ; le mot désigne aussi le rêve", type: "" },
  { terme: "el estrés", definition: "stress", type: "" },
  { terme: "la terapia", definition: "thérapie", type: "" },
  { terme: "el síntoma", definition: "symptôme", type: "" },
  { terme: "la recuperación", definition: "guérison", type: "" },
  { terme: "la urgencia", definition: "urgence", type: "" },
  { terme: "la ambulancia", definition: "ambulance", type: "" },
  { terme: "la farmacia", definition: "pharmacie", type: "" },
  { terme: "la receta médica", definition: "ordonnance", type: "" },
  { terme: "la venda", definition: "bandage", type: "" },
  { terme: "la infección", definition: "infection", type: "" },
  { terme: "el virus", definition: "virus", type: "" },
  { terme: "la bacteria", definition: "bactérie", type: "" },
  { terme: "la silla de ruedas", definition: "fauteuil roulant", type: "" },
  { terme: "la muleta", definition: "béquille", type: "" },
  { terme: "estreñido", definition: "constipé", type: "" },
  { terme: "crónico", definition: "chronique", type: "" },
  { terme: "la revisión médica", definition: "bilan de contrôle", type: "" },
  { terme: "el efecto secundario", definition: "effet indésirable d'un traitement", type: "" },
  { terme: "el sistema inmunitario", definition: "système immunitaire", type: "" },
  { terme: "la salud mental", definition: "santé mentale", type: "" },
  { terme: "la tirita", definition: "pansement", type: "" },
  { terme: "el diagnóstico", definition: "diagnostic", type: "" },
  { terme: "el tratamiento", definition: "traitement", type: "" },
  { terme: "el análisis de sangre", definition: "analyse de sang", type: "" },
  { terme: "el dolor de garganta", definition: "mal de gorge", type: "" },
  { terme: "los primeros auxilios", definition: "premiers secours", type: "" },
  { terme: "la esperanza de vida", definition: "espérance de vie", type: "" },
  { terme: "el quirófano", definition: "bloc opératoire", type: "" },
  { terme: "la UCI", definition: "soins intensifs", type: "" },
  { terme: "el médico de cabecera", definition: "médecin traitant", type: "" },
  { terme: "el cirujano", definition: "chirurgien", type: "" },
  { terme: "la Seguridad Social", definition: "sécurité sociale en Espagne", type: "" },
  { terme: "la higiene", definition: "hygiène", type: "" },
  { terme: "embarazada", definition: "enceinte, et non « embarrassée »", type: "" },
  { terme: "el pie", definition: "pied", type: "" },
  { terme: "la mano", definition: "main (nom féminin)", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "hincharse", definition: "enfler", type: "" },
  { terme: "curarse", definition: "guérir", type: "" },
  { terme: "aguantar", definition: "tenir bon", type: "" },
  { terme: "tumbarse", definition: "s'allonger", type: "" },
  { terme: "levantarse", definition: "se lever", type: "" },
  { terme: "tomarse", definition: "avaler (un médicament)", type: "" },
  { terme: "atender", definition: "s'occuper de quelqu'un, et non « attendre »", type: "" },
  { terme: "contraer", definition: "contracter une maladie", type: "" },
  { terme: "engordar", definition: "prendre du poids", type: "" },
  { terme: "adelgazar", definition: "perdre du poids", type: "" },
  { terme: "despertarse", definition: "se réveiller", type: "" },
  { terme: "dormirse", definition: "s'endormir", type: "" },
  { terme: "descansar", definition: "se reposer", type: "" },
  { terme: "desmayarse", definition: "s'évanouir", type: "" },
  { terme: "recetar", definition: "prescrire un traitement", type: "" },
  // —— 20 expressions ——
  { terme: "estar hecho polvo", definition: "être lessivé", type: "expression" },
  { terme: "estar en las últimas", definition: "être au bout du rouleau", type: "expression" },
  { terme: "dar a luz", definition: "accoucher", type: "expression" },
  { terme: "no pegar ojo", definition: "ne pas fermer l'œil", type: "expression" },
  { terme: "estar pachucho", definition: "être patraque", type: "expression" },
  { terme: "estar en los huesos", definition: "n'avoir que la peau sur les os", type: "expression" },
  { terme: "curarse en salud", definition: "prévenir un mal à l'avance", type: "expression" },
  { terme: "lo que no mata engorda", definition: "sortir renforcé d'une épreuve", type: "expression" },
  { terme: "tener el corazón en un puño", definition: "avoir le cœur serré", type: "expression" },
  { terme: "sudar la gota gorda", definition: "suer sang et eau", type: "expression" },
  { terme: "estar como una rosa", definition: "avoir une mine superbe", type: "expression" },
  { terme: "estirar la pata", definition: "mourir, de façon familière", type: "expression" },
  { terme: "tener la sangre fría", definition: "garder son sang-froid", type: "expression" },
  { terme: "a corazón abierto", definition: "parler en toute franchise", type: "expression" },
  { terme: "no tener corazón", definition: "manquer de cœur", type: "expression" },
  { terme: "estar con el alma en vilo", definition: "rester le cœur suspendu", type: "expression" },
  { terme: "echar los hígados", definition: "s'échiner", type: "expression" },
  { terme: "estar más sano que una pera", definition: "déborder de santé", type: "expression" },
  { terme: "reventar de salud", definition: "péter la forme", type: "expression" },
  { terme: "hacer de tripas corazón", definition: "s'armer de courage", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-05-sante-corps.xlsx"));
