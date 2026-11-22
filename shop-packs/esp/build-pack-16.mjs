/**
 * Pack 16 — Ville & orientation (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "largo", definition: "long, et non « large »", type: "" },
  { terme: "ancho", definition: "large", type: "" },
  { terme: "el mapa", definition: "carte géographique (nom masculin)", type: "" },
  { terme: "el plano", definition: "plan de ville", type: "" },
  { terme: "la calle", definition: "rue", type: "" },
  { terme: "la avenida", definition: "avenue", type: "" },
  { terme: "la plaza", definition: "place publique", type: "" },
  { terme: "el barrio", definition: "quartier", type: "" },
  { terme: "el centro", definition: "centre-ville", type: "" },
  { terme: "las afueras", definition: "banlieue", type: "" },
  { terme: "la acera", definition: "trottoir", type: "" },
  { terme: "el semáforo", definition: "feu tricolore", type: "" },
  { terme: "la esquina", definition: "coin de rue", type: "" },
  { terme: "el cruce", definition: "carrefour", type: "" },
  { terme: "la rotonda", definition: "rond-point", type: "" },
  { terme: "el paso de cebra", definition: "passage piéton", type: "" },
  { terme: "el puente", definition: "pont", type: "" },
  { terme: "el túnel", definition: "tunnel", type: "" },
  { terme: "el aparcamiento", definition: "parking", type: "" },
  { terme: "la parada", definition: "arrêt", type: "" },
  { terme: "el autobús", definition: "bus", type: "" },
  { terme: "el metro", definition: "métro", type: "" },
  { terme: "el tranvía", definition: "tramway", type: "" },
  { terme: "la estación", definition: "gare", type: "" },
  { terme: "el ayuntamiento", definition: "mairie", type: "" },
  { terme: "la catedral", definition: "cathédrale", type: "" },
  { terme: "el castillo", definition: "château", type: "" },
  { terme: "el puerto", definition: "port", type: "" },
  { terme: "el muelle", definition: "quai", type: "" },
  { terme: "la fuente", definition: "fontaine", type: "" },
  { terme: "el banco público", definition: "banc public", type: "" },
  { terme: "la farola", definition: "lampadaire", type: "" },
  { terme: "el escaparate", definition: "vitrine", type: "" },
  { terme: "las obras", definition: "chantier", type: "" },
  { terme: "el andamio", definition: "échafaudage", type: "" },
  { terme: "el rascacielos", definition: "gratte-ciel", type: "" },
  { terme: "el portal", definition: "porte d'immeuble", type: "" },
  { terme: "la planta baja", definition: "rez-de-chaussée", type: "" },
  { terme: "el ático", definition: "dernier étage", type: "" },
  { terme: "el norte", definition: "nord", type: "" },
  { terme: "el sur", definition: "sud", type: "" },
  { terme: "el este", definition: "est", type: "" },
  { terme: "el oeste", definition: "ouest", type: "" },
  { terme: "la izquierda", definition: "gauche", type: "" },
  { terme: "la derecha", definition: "droite", type: "" },
  { terme: "todo recto", definition: "tout droit", type: "" },
  { terme: "la brújula", definition: "boussole", type: "" },
  { terme: "el atajo", definition: "raccourci", type: "" },
  { terme: "el rodeo", definition: "détour", type: "" },
  { terme: "la dirección", definition: "adresse", type: "" },
  { terme: "el código postal", definition: "code postal", type: "" },
  { terme: "el peatón", definition: "piéton", type: "" },
  { terme: "el paso subterráneo", definition: "passage souterrain", type: "" },
  { terme: "la pasarela", definition: "passerelle", type: "" },
  { terme: "el punto de referencia", definition: "point de repère", type: "" },
  { terme: "la oficina de turismo", definition: "office de tourisme", type: "" },
  { terme: "el hostal", definition: "petite auberge", type: "" },
  { terme: "la recepción", definition: "réception d'un hôtel", type: "" },
  { terme: "el quiosco", definition: "kiosque", type: "" },
  { terme: "el buzón", definition: "boîte aux lettres", type: "" },
  { terme: "la señal", definition: "panneau", type: "" },
  { terme: "el callejón", definition: "ruelle", type: "" },
  { terme: "la manzana", definition: "pâté de maisons ; le mot veut aussi dire « pomme »", type: "" },
  { terme: "el casco antiguo", definition: "vieille ville", type: "" },
  { terme: "la muralla", definition: "rempart", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "girar", definition: "tourner", type: "" },
  { terme: "cruzar", definition: "traverser", type: "" },
  { terme: "doblar", definition: "tourner à un coin", type: "" },
  { terme: "seguir", definition: "continuer tout droit", type: "" },
  { terme: "perderse", definition: "se perdre", type: "" },
  { terme: "orientarse", definition: "s'orienter", type: "" },
  { terme: "aparcar", definition: "se garer", type: "" },
  { terme: "torcer", definition: "obliquer", type: "" },
  { terme: "atravesar", definition: "traverser de part en part", type: "" },
  { terme: "rodear", definition: "contourner", type: "" },
  { terme: "indicar", definition: "indiquer le chemin", type: "" },
  { terme: "acercarse", definition: "s'approcher", type: "" },
  { terme: "alejarse", definition: "s'éloigner", type: "" },
  { terme: "dirigirse", definition: "se diriger", type: "" },
  { terme: "preguntar el camino", definition: "demander son chemin", type: "" },
  // —— 20 expressions ——
  { terme: "perder el norte", definition: "ne plus s'y retrouver", type: "expression" },
  { terme: "no dejar piedra sobre piedra", definition: "ne rien laisser debout", type: "expression" },
  { terme: "echar raíces", definition: "s'enraciner dans un lieu", type: "expression" },
  { terme: "a la vuelta de la esquina", definition: "être tout proche", type: "expression" },
  { terme: "tirar por la calle de en medio", definition: "aller au plus court", type: "expression" },
  { terme: "no saber a qué carta quedarse", definition: "hésiter entre plusieurs options", type: "expression" },
  { terme: "poner pies en polvorosa", definition: "détaler", type: "expression" },
  { terme: "ir por buen camino", definition: "être sur la bonne voie", type: "expression" },
  { terme: "conocer como la palma de su mano", definition: "connaître comme sa poche", type: "expression" },
  { terme: "a tontas y a locas", definition: "agir à tort et à travers", type: "expression" },
  { terme: "no llegar ni a la esquina", definition: "ne même pas effleurer la question", type: "expression" },
  { terme: "a pie de calle", definition: "coller au réel", type: "expression" },
  { terme: "quedarse en la calle", definition: "se retrouver sans logement", type: "expression" },
  { terme: "abrir calle", definition: "se frayer un passage", type: "expression" },
  { terme: "estar en la luna de Valencia", definition: "rester bredouille", type: "expression" },
  { terme: "por estos lares", definition: "dans le coin", type: "expression" },
  { terme: "a la deriva", definition: "partir à la dérive", type: "expression" },
  { terme: "buscar una aguja en un pajar", definition: "chercher une aiguille dans une botte de foin", type: "expression" },
  { terme: "irse por los cerros de Úbeda", definition: "s'égarer loin du sujet", type: "expression" },
  { terme: "donde Cristo dio las tres voces", definition: "au diable vauvert", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-16-ville-orientation.xlsx"));
