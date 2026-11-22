/**
 * Pack 7 — Vie quotidienne (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el hogar", definition: "foyer", type: "" },
  { terme: "el piso", definition: "appartement", type: "" },
  { terme: "el alquiler", definition: "loyer", type: "" },
  { terme: "la factura", definition: "facture", type: "" },
  { terme: "la llave", definition: "clé", type: "" },
  { terme: "la cerradura", definition: "serrure", type: "" },
  { terme: "la puerta", definition: "porte", type: "" },
  { terme: "el timbre", definition: "sonnette", type: "" },
  { terme: "el escalón", definition: "marche d'escalier", type: "" },
  { terme: "el ascensor", definition: "ascenseur", type: "" },
  { terme: "el sofá", definition: "canapé", type: "" },
  { terme: "la cama", definition: "lit", type: "" },
  { terme: "la almohada", definition: "oreiller", type: "" },
  { terme: "la sábana", definition: "drap", type: "" },
  { terme: "la toalla", definition: "serviette de toilette", type: "" },
  { terme: "el baño", definition: "salle de bains", type: "" },
  { terme: "la ducha", definition: "douche", type: "" },
  { terme: "el grifo", definition: "robinet", type: "" },
  { terme: "el fregadero", definition: "évier", type: "" },
  { terme: "el jabón", definition: "savon", type: "" },
  { terme: "el cepillo", definition: "brosse", type: "" },
  { terme: "el espejo", definition: "miroir", type: "" },
  { terme: "la papelera", definition: "corbeille", type: "" },
  { terme: "la estantería", definition: "étagère", type: "" },
  { terme: "el cajón", definition: "tiroir", type: "" },
  { terme: "la nevera", definition: "réfrigérateur", type: "" },
  { terme: "el horno", definition: "four", type: "" },
  { terme: "la sartén", definition: "poêle", type: "" },
  { terme: "la cazuela", definition: "casserole", type: "" },
  { terme: "el plato", definition: "assiette", type: "" },
  { terme: "la taza", definition: "tasse", type: "" },
  { terme: "el tenedor", definition: "fourchette", type: "" },
  { terme: "el cuchillo", definition: "couteau", type: "" },
  { terme: "la cuchara", definition: "cuillère", type: "" },
  { terme: "el desayuno", definition: "petit-déjeuner", type: "" },
  { terme: "la comida", definition: "repas de midi", type: "" },
  { terme: "la merienda", definition: "goûter", type: "" },
  { terme: "la cena", definition: "dîner", type: "" },
  { terme: "la compra", definition: "courses alimentaires", type: "" },
  { terme: "la colada", definition: "lessive", type: "" },
  { terme: "el planchado", definition: "repassage", type: "" },
  { terme: "el aspirador", definition: "aspirateur", type: "" },
  { terme: "el desorden", definition: "désordre", type: "" },
  { terme: "la costumbre", definition: "habitude", type: "" },
  { terme: "la rutina", definition: "routine quotidienne", type: "" },
  { terme: "el vecino", definition: "voisin", type: "" },
  { terme: "el casero", definition: "propriétaire bailleur", type: "" },
  { terme: "el inquilino", definition: "locataire", type: "" },
  { terme: "el recado", definition: "course à faire", type: "" },
  { terme: "la cola", definition: "file d'attente", type: "" },
  { terme: "la cartera", definition: "portefeuille", type: "" },
  { terme: "las rebajas", definition: "soldes", type: "" },
  { terme: "el quehacer", definition: "ouvrage ménager", type: "" },
  { terme: "la siesta", definition: "sieste", type: "" },
  { terme: "el microondas", definition: "four à micro-ondes", type: "" },
  { terme: "el lavavajillas", definition: "lave-vaisselle", type: "" },
  { terme: "el detergente", definition: "produit lessive", type: "" },
  { terme: "el compañero de piso", definition: "colocataire", type: "" },
  { terme: "la cortina", definition: "rideau", type: "" },
  { terme: "el rato", definition: "moment, et non « rat »", type: "" },
  { terme: "la ropa", definition: "vêtements, et non « robe »", type: "" },
  { terme: "el vestido", definition: "robe", type: "" },
  { terme: "la fecha", definition: "date, et non « fête »", type: "" },
  { terme: "el agua", definition: "eau (nom féminin)", type: "" },
  { terme: "el día", definition: "jour (nom masculin)", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "encender", definition: "allumer", type: "" },
  { terme: "apagar", definition: "éteindre", type: "" },
  { terme: "guardar", definition: "ranger, et non seulement « garder »", type: "" },
  { terme: "ordenar", definition: "mettre en ordre", type: "" },
  { terme: "fregar", definition: "faire la vaisselle", type: "" },
  { terme: "colgar la ropa", definition: "étendre du linge", type: "" },
  { terme: "abastecerse", definition: "faire des provisions", type: "" },
  { terme: "prescindir", definition: "se passer de", type: "" },
  { terme: "recoger la mesa", definition: "débarrasser la table", type: "" },
  { terme: "enfriar", definition: "refroidir", type: "" },
  { terme: "elegir", definition: "choisir", type: "" },
  { terme: "tirar a la basura", definition: "jeter à la poubelle", type: "" },
  { terme: "acostarse", definition: "se coucher", type: "" },
  { terme: "ducharse", definition: "se doucher", type: "" },
  { terme: "hacer la cama", definition: "faire le lit", type: "" },
  // —— 20 expressions ——
  { terme: "a cuerpo de rey", definition: "avec tous les égards", type: "expression" },
  { terme: "al que madruga Dios le ayuda", definition: "récompenser le fait de s'y prendre tôt", type: "expression" },
  { terme: "dormir a pierna suelta", definition: "dormir à poings fermés", type: "expression" },
  { terme: "no dar abasto", definition: "ne plus suffire à la tâche", type: "expression" },
  { terme: "dar la vuelta a la tortilla", definition: "retourner la situation", type: "expression" },
  { terme: "con la casa a cuestas", definition: "transporter toute sa vie avec soi", type: "expression" },
  { terme: "en un santiamén", definition: "en un clin d'œil", type: "expression" },
  { terme: "a la chita callando", definition: "agir en douce", type: "expression" },
  { terme: "ni fu ni fa", definition: "ne faire ni chaud ni froid", type: "expression" },
  { terme: "caer en saco roto", definition: "rester sans suite", type: "expression" },
  { terme: "vivir al día", definition: "vivre au jour le jour", type: "expression" },
  { terme: "cada mochuelo a su olivo", definition: "chacun chez soi", type: "expression" },
  { terme: "entre pitos y flautas", definition: "laisser filer le temps entre diverses occupations", type: "expression" },
  { terme: "a trancas y barrancas", definition: "tant bien que mal", type: "expression" },
  { terme: "sin comerlo ni beberlo", definition: "sans l'avoir cherché", type: "expression" },
  { terme: "estar en la edad del pavo", definition: "être dans l'âge ingrat", type: "expression" },
  { terme: "no ver tres en un burro", definition: "n'y voir goutte", type: "expression" },
  { terme: "en casa del herrero, cuchillo de palo", definition: "manquer chez soi de ce que l'on fournit aux autres", type: "expression" },
  { terme: "irse por las ramas", definition: "tourner autour du pot", type: "expression" },
  { terme: "no estar el horno para bollos", definition: "ce n'est vraiment pas le moment", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-07-vie-quotidienne.xlsx"));
