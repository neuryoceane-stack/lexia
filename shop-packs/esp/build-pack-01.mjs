/**
 * Pack 1 — Environnement & climat (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el medio ambiente", definition: "environnement", type: "" },
  { terme: "el clima", definition: "climat", type: "" },
  { terme: "la contaminación del aire", definition: "pollution de l'air", type: "" },
  { terme: "el reciclaje", definition: "recyclage", type: "" },
  { terme: "la sostenibilidad", definition: "développement durable", type: "" },
  { terme: "el ecosistema", definition: "écosystème", type: "" },
  { terme: "la biodiversidad", definition: "biodiversité", type: "" },
  { terme: "la tala rasa", definition: "coupe rase", type: "" },
  { terme: "el contaminante", definition: "polluant", type: "" },
  { terme: "el efecto invernadero", definition: "effet de serre", type: "" },
  { terme: "el dióxido de carbono", definition: "dioxyde de carbone", type: "" },
  { terme: "la huella de carbono", definition: "empreinte carbone", type: "" },
  { terme: "el calentamiento global", definition: "réchauffement de la planète", type: "" },
  { terme: "el cambio climático", definition: "changement climatique", type: "" },
  { terme: "la sequía", definition: "sécheresse", type: "" },
  { terme: "la crecida", definition: "crue", type: "" },
  { terme: "el incendio forestal", definition: "incendie de forêt", type: "" },
  { terme: "el permafrost", definition: "pergélisol", type: "" },
  { terme: "la capa de ozono", definition: "couche d'ozone", type: "" },
  { terme: "la lluvia ácida", definition: "pluie acide", type: "" },
  { terme: "el vertedero", definition: "décharge", type: "" },
  { terme: "el mantillo", definition: "terreau, humus", type: "" },
  { terme: "la basura", definition: "ordures ménagères", type: "" },
  { terme: "los residuos abandonados", definition: "détritus laissés à l'abandon", type: "" },
  { terme: "el herbicida", definition: "désherbant", type: "" },
  { terme: "la agricultura ecológica", definition: "agriculture biologique", type: "" },
  { terme: "la renaturalización", definition: "restauration d'un milieu naturel", type: "" },
  { terme: "la especie amenazada", definition: "espèce menacée", type: "" },
  { terme: "el corredor ecológico", definition: "corridor écologique", type: "" },
  { terme: "la extinción de especies", definition: "disparition des espèces", type: "" },
  { terme: "la energía solar", definition: "énergie solaire", type: "" },
  { terme: "la energía eólica", definition: "énergie éolienne", type: "" },
  { terme: "la energía hidráulica", definition: "énergie hydraulique", type: "" },
  { terme: "el combustible fósil", definition: "combustible fossile", type: "" },
  { terme: "el carbón", definition: "charbon", type: "" },
  { terme: "la marea negra", definition: "marée noire", type: "" },
  { terme: "el lixiviado", definition: "liquide pollué issu d'une décharge (lixiviat)", type: "" },
  { terme: "el agua subterránea", definition: "eau souterraine (nom féminin)", type: "" },
  { terme: "el retroceso de la costa", definition: "recul du littoral", type: "" },
  { terme: "la erosión del suelo", definition: "érosion du sol", type: "" },
  { terme: "biodegradable", definition: "biodégradable", type: "" },
  { terme: "el envase de un solo uso", definition: "emballage à usage unique", type: "" },
  { terme: "el óxido nitroso", definition: "protoxyde d'azote", type: "" },
  { terme: "la reforestación", definition: "reboisement", type: "" },
  { terme: "neutro en carbono", definition: "neutre en carbone", type: "" },
  { terme: "los gases de efecto invernadero", definition: "gaz à effet de serre", type: "" },
  { terme: "la calidad del aire", definition: "qualité de l'air", type: "" },
  { terme: "la isla de calor urbana", definition: "îlot de chaleur urbain", type: "" },
  { terme: "las aguas residuales", definition: "eaux usées", type: "" },
  { terme: "el residuo peligroso", definition: "déchet dangereux", type: "" },
  { terme: "el arrecife de coral", definition: "récif corallien", type: "" },
  { terme: "la sobrepesca", definition: "surpêche", type: "" },
  { terme: "la reserva natural", definition: "réserve naturelle", type: "" },
  { terme: "la energía renovable", definition: "énergie renouvelable", type: "" },
  { terme: "la especie invasora", definition: "espèce invasive", type: "" },
  { terme: "la cadena alimentaria", definition: "chaîne alimentaire", type: "" },
  { terme: "la protección del clima", definition: "protection du climat", type: "" },
  { terme: "el coche eléctrico", definition: "voiture électrique", type: "" },
  { terme: "la ola de calor", definition: "canicule", type: "" },
  { terme: "la subida del nivel del mar", definition: "hausse du niveau des mers", type: "" },
  { terme: "el microplástico", definition: "microplastique", type: "" },
  { terme: "la turbera", definition: "tourbière", type: "" },
  { terme: "la central nuclear", definition: "centrale nucléaire", type: "" },
  { terme: "la transición energética", definition: "transition énergétique", type: "" },
  { terme: "la separación de residuos", definition: "tri des déchets", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "reciclar", definition: "recycler", type: "" },
  { terme: "talar", definition: "couper des arbres à blanc", type: "" },
  { terme: "extinguirse", definition: "disparaître en tant qu'espèce", type: "" },
  { terme: "reducir el consumo", definition: "réduire sa consommation", type: "" },
  { terme: "derretirse", definition: "fondre sous l'effet de la chaleur", type: "" },
  { terme: "secarse", definition: "s'assécher", type: "" },
  { terme: "liberar", definition: "relâcher un gaz ou un liquide dans le milieu", type: "" },
  { terme: "repoblar", definition: "reboiser", type: "" },
  { terme: "erradicar", definition: "faire disparaître complètement", type: "" },
  { terme: "potabilizar", definition: "rendre une eau potable", type: "" },
  { terme: "aumentar", definition: "augmenter (niveau ou température)", type: "" },
  { terme: "emitir", definition: "rejeter un gaz", type: "" },
  { terme: "infiltrarse", definition: "s'infiltrer dans le sol", type: "" },
  { terme: "retroceder", definition: "reculer ou diminuer", type: "" },
  { terme: "contaminar", definition: "polluer", type: "" },
  // —— 20 expressions ——
  { terme: "ser una gota en el océano", definition: "n'avoir presque aucun effet", type: "expression" },
  { terme: "ser la punta del iceberg", definition: "n'être que la partie visible d'un problème bien plus grand", type: "expression" },
  { terme: "nadar contra corriente", definition: "aller contre l'opinion générale", type: "expression" },
  { terme: "quedarse en agua de borrajas", definition: "tomber à l'eau", type: "expression" },
  { terme: "echar leña al fuego", definition: "envenimer un conflit", type: "expression" },
  { terme: "ser puro humo", definition: "n'avoir aucune substance réelle", type: "expression" },
  { terme: "los árboles no dejan ver el bosque", definition: "manquer l'essentiel à force de détails", type: "expression" },
  { terme: "tirar la toalla", definition: "abandonner la partie", type: "expression" },
  { terme: "ser agua pasada", definition: "appartenir déjà au passé", type: "expression" },
  { terme: "dar palos de ciego", definition: "agir à l'aveugle", type: "expression" },
  { terme: "hacer oídos sordos", definition: "refuser d'écouter", type: "expression" },
  { terme: "crecer como setas", definition: "se multiplier très vite", type: "expression" },
  { terme: "hacer borrón y cuenta nueva", definition: "effacer le passé et repartir à zéro", type: "expression" },
  { terme: "ahogarse en un vaso de agua", definition: "se laisser déborder par un petit problème", type: "expression" },
  { terme: "dejar en el tintero", definition: "laisser de côté sans le traiter", type: "expression" },
  { terme: "salir de Guatemala y entrar en Guatepeor", definition: "aller de mal en pis", type: "expression" },
  { terme: "ver la luz al final del túnel", definition: "entrevoir la fin d'une difficulté", type: "expression" },
  { terme: "tener vía libre", definition: "avoir le champ libre", type: "expression" },
  { terme: "abrir la caja de los truenos", definition: "déclencher une cascade de problèmes", type: "expression" },
  { terme: "llover sobre mojado", definition: "empirer une situation déjà mauvaise", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-01-environnement.xlsx"));
