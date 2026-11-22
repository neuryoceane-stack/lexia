/**
 * Pack 14 — Relations & émotions (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el amigo", definition: "ami", type: "" },
  { terme: "la amistad", definition: "amitié", type: "" },
  { terme: "el amor", definition: "amour", type: "" },
  { terme: "la pareja", definition: "couple", type: "" },
  { terme: "el novio", definition: "petit ami", type: "" },
  { terme: "la familia", definition: "famille", type: "" },
  { terme: "los padres", definition: "parents", type: "" },
  { terme: "el padre", definition: "père", type: "" },
  { terme: "la madre", definition: "mère", type: "" },
  { terme: "el hermano", definition: "frère", type: "" },
  { terme: "la hermana", definition: "sœur", type: "" },
  { terme: "el hijo", definition: "fils", type: "" },
  { terme: "la hija", definition: "fille", type: "" },
  { terme: "el abuelo", definition: "grand-père", type: "" },
  { terme: "el primo", definition: "cousin", type: "" },
  { terme: "la prima", definition: "cousine", type: "" },
  { terme: "el apellido", definition: "nom de famille, et non « prénom »", type: "" },
  { terme: "el nombre", definition: "prénom", type: "" },
  { terme: "el compromiso", definition: "engagement, et non seulement « compromis »", type: "" },
  { terme: "sensible", definition: "émotif, et non « sensé »", type: "" },
  { terme: "la ilusión", definition: "joie anticipée, et non seulement « illusion »", type: "" },
  { terme: "el disgusto", definition: "contrariété, et non « dégoût »", type: "" },
  { terme: "el asco", definition: "dégoût", type: "" },
  { terme: "la boda", definition: "mariage", type: "" },
  { terme: "el divorcio", definition: "divorce", type: "" },
  { terme: "la cita", definition: "rendez-vous", type: "" },
  { terme: "el beso", definition: "baiser", type: "" },
  { terme: "el abrazo", definition: "câlin", type: "" },
  { terme: "la confianza", definition: "confiance", type: "" },
  { terme: "la traición", definition: "trahison", type: "" },
  { terme: "los celos", definition: "jalousie", type: "" },
  { terme: "la nostalgia", definition: "nostalgie", type: "" },
  { terme: "el enfado", definition: "colère", type: "" },
  { terme: "la alegría", definition: "joie", type: "" },
  { terme: "la tristeza", definition: "tristesse", type: "" },
  { terme: "el miedo", definition: "peur", type: "" },
  { terme: "la vergüenza", definition: "honte", type: "" },
  { terme: "el orgullo", definition: "fierté", type: "" },
  { terme: "la envidia", definition: "envie", type: "" },
  { terme: "la gratitud", definition: "gratitude", type: "" },
  { terme: "el perdón", definition: "pardon", type: "" },
  { terme: "la soledad", definition: "solitude", type: "" },
  { terme: "el conocido", definition: "connaissance", type: "" },
  { terme: "la suegra", definition: "belle-mère", type: "" },
  { terme: "el cuñado", definition: "beau-frère", type: "" },
  { terme: "soltero", definition: "célibataire", type: "" },
  { terme: "casado", definition: "marié", type: "" },
  { terme: "el sentimiento", definition: "sentiment", type: "" },
  { terme: "la emoción", definition: "émotion", type: "" },
  { terme: "la pena", definition: "peine, chagrin", type: "" },
  { terme: "el alivio", definition: "soulagement", type: "" },
  { terme: "la decepción", definition: "déception", type: "" },
  { terme: "el consuelo", definition: "réconfort", type: "" },
  { terme: "la ternura", definition: "tendresse", type: "" },
  { terme: "el respeto", definition: "respect", type: "" },
  { terme: "la lealtad", definition: "loyauté", type: "" },
  { terme: "el ánimo", definition: "moral", type: "" },
  { terme: "el cariño", definition: "affection", type: "" },
  { terme: "la discusión", definition: "dispute", type: "" },
  { terme: "el vecindario", definition: "voisinage", type: "" },
  { terme: "la infancia", definition: "enfance", type: "" },
  { terme: "la adolescencia", definition: "adolescence", type: "" },
  { terme: "el huésped", definition: "invité", type: "" },
  { terme: "la despedida", definition: "adieu", type: "" },
  { terme: "el reencuentro", definition: "retrouvailles", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "discutir", definition: "se disputer, et non « discuter »", type: "" },
  { terme: "soportar", definition: "endurer, et non « soutenir »", type: "" },
  { terme: "apoyar", definition: "soutenir", type: "" },
  { terme: "querer", definition: "aimer", type: "" },
  { terme: "odiar", definition: "détester", type: "" },
  { terme: "enamorarse", definition: "tomber amoureux", type: "" },
  { terme: "casarse", definition: "se marier", type: "" },
  { terme: "divorciarse", definition: "divorcer", type: "" },
  { terme: "perdonar", definition: "pardonner", type: "" },
  { terme: "confiar", definition: "faire confiance", type: "" },
  { terme: "echar de menos", definition: "regretter l'absence de quelqu'un", type: "" },
  { terme: "consolar", definition: "réconforter", type: "" },
  { terme: "enfadarse", definition: "se mettre en colère", type: "" },
  { terme: "reír", definition: "rire", type: "" },
  { terme: "llorar", definition: "pleurer", type: "" },
  // —— 20 expressions ——
  { terme: "ser uña y carne", definition: "être inséparables", type: "expression" },
  { terme: "llevarse como el perro y el gato", definition: "s'entendre comme chien et chat", type: "expression" },
  { terme: "dar calabazas", definition: "éconduire", type: "expression" },
  { terme: "ser un flechazo", definition: "coup de foudre", type: "expression" },
  { terme: "no llegar la sangre al río", definition: "en rester à une dispute sans gravité", type: "expression" },
  { terme: "tomar el pelo", definition: "se moquer de quelqu'un", type: "expression" },
  { terme: "enterrar el hacha de guerra", definition: "enterrer la hache de guerre", type: "expression" },
  { terme: "de tal palo, tal astilla", definition: "tenir de ses parents", type: "expression" },
  { terme: "ojos que no ven, corazón que no siente", definition: "s'oublier dès qu'on se perd de vue", type: "expression" },
  { terme: "poner los cuernos", definition: "tromper son conjoint", type: "expression" },
  { terme: "hacer buenas migas", definition: "bien s'entendre", type: "expression" },
  { terme: "llorar lágrimas de cocodrilo", definition: "verser des larmes de crocodile", type: "expression" },
  { terme: "no caber en sí de gozo", definition: "ne pas se tenir de joie", type: "expression" },
  { terme: "tener un nudo en la garganta", definition: "avoir la gorge nouée", type: "expression" },
  { terme: "morirse de risa", definition: "mourir de rire", type: "expression" },
  { terme: "estar hasta la coronilla", definition: "en avoir ras-le-bol", type: "expression" },
  { terme: "dar la espalda", definition: "tourner le dos", type: "expression" },
  { terme: "llevarse a matar", definition: "se détester", type: "expression" },
  { terme: "con el corazón en la mano", definition: "agir en toute sincérité", type: "expression" },
  { terme: "ser la media naranja", definition: "être l'âme sœur", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-14-relations-emotions.xlsx"));
