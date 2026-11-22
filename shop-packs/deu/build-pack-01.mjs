/**
 * Pack 1 — Environnement & climat (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Umwelt", definition: "environnement", type: "" },
  { terme: "das Klima", definition: "climat", type: "" },
  { terme: "die Luftverschmutzung", definition: "pollution de l'air", type: "" },
  { terme: "das Recycling", definition: "recyclage", type: "" },
  { terme: "die Nachhaltigkeit", definition: "développement durable", type: "" },
  { terme: "das Ökosystem", definition: "écosystème", type: "" },
  { terme: "die Artenvielfalt", definition: "biodiversité", type: "" },
  { terme: "der Kahlschlag", definition: "coupe rase", type: "" },
  { terme: "der Schadstoff", definition: "polluant", type: "" },
  { terme: "der Treibhauseffekt", definition: "effet de serre", type: "" },
  { terme: "das Kohlendioxid", definition: "dioxyde de carbone", type: "" },
  { terme: "der CO2-Fußabdruck", definition: "empreinte carbone", type: "" },
  { terme: "die Erderwärmung", definition: "réchauffement climatique", type: "" },
  { terme: "der Klimawandel", definition: "changement climatique", type: "" },
  { terme: "die Dürre", definition: "sécheresse", type: "" },
  { terme: "das Hochwasser", definition: "crue", type: "" },
  { terme: "der Waldbrand", definition: "incendie de forêt", type: "" },
  { terme: "der Permafrost", definition: "pergélisol", type: "" },
  { terme: "die Ozonschicht", definition: "couche d'ozone", type: "" },
  { terme: "der saure Regen", definition: "pluie acide", type: "" },
  { terme: "die Deponie", definition: "décharge", type: "" },
  { terme: "der Mulch", definition: "paillis", type: "" },
  { terme: "der Müll", definition: "ordures", type: "" },
  { terme: "der Unrat", definition: "détritus", type: "" },
  { terme: "das Unkrautmittel", definition: "désherbant", type: "" },
  { terme: "der Ökolandbau", definition: "agriculture biologique", type: "" },
  { terme: "die Renaturierung", definition: "restauration d'un milieu naturel", type: "" },
  { terme: "die bedrohte Art", definition: "espèce menacée", type: "" },
  { terme: "der Wildtierkorridor", definition: "corridor écologique", type: "" },
  { terme: "das Artensterben", definition: "disparition des espèces", type: "" },
  { terme: "die Solarenergie", definition: "énergie solaire", type: "" },
  { terme: "die Windkraft", definition: "énergie éolienne", type: "" },
  { terme: "die Wasserkraft", definition: "énergie hydraulique", type: "" },
  { terme: "der fossile Brennstoff", definition: "combustible fossile", type: "" },
  { terme: "die Kohle", definition: "charbon", type: "" },
  { terme: "die Ölpest", definition: "marée noire", type: "" },
  { terme: "das Sickerwasser", definition: "liquide pollué qui s'écoule d'une décharge", type: "" },
  { terme: "das Grundwasser", definition: "eau souterraine", type: "" },
  { terme: "der Küstenrückgang", definition: "recul du littoral", type: "" },
  { terme: "die Bodenerosion", definition: "érosion du sol", type: "" },
  { terme: "biologisch abbaubar", definition: "biodégradable", type: "" },
  { terme: "der Einwegbecher", definition: "gobelet jetable", type: "" },
  { terme: "das Lachgas", definition: "protoxyde d'azote", type: "" },
  { terme: "die Aufforstung", definition: "reboisement", type: "" },
  { terme: "klimaneutral", definition: "neutre en carbone", type: "" },
  { terme: "die Treibhausgase", definition: "gaz à effet de serre", type: "" },
  { terme: "die Luftqualität", definition: "qualité de l'air", type: "" },
  { terme: "die Wärmeinsel", definition: "îlot de chaleur urbain", type: "" },
  { terme: "das Abwasser", definition: "eaux usées", type: "" },
  { terme: "der Sondermüll", definition: "déchets dangereux", type: "" },
  { terme: "das Korallenriff", definition: "récif corallien", type: "" },
  { terme: "die Überfischung", definition: "surpêche", type: "" },
  { terme: "das Naturschutzgebiet", definition: "réserve naturelle", type: "" },
  { terme: "die erneuerbare Energie", definition: "énergie renouvelable", type: "" },
  { terme: "die eingeschleppte Art", definition: "espèce introduite qui prolifère", type: "" },
  { terme: "die Nahrungskette", definition: "chaîne alimentaire", type: "" },
  { terme: "der Klimaschutz", definition: "protection du climat", type: "" },
  { terme: "das Elektroauto", definition: "voiture électrique", type: "" },
  { terme: "die Hitzewelle", definition: "canicule", type: "" },
  { terme: "der Meeresspiegelanstieg", definition: "hausse du niveau des mers", type: "" },
  { terme: "das Mikroplastik", definition: "microplastique", type: "" },
  { terme: "das Hochmoor", definition: "tourbière", type: "" },
  { terme: "das Atomkraftwerk", definition: "centrale nucléaire", type: "" },
  { terme: "die Energiewende", definition: "transition énergétique", type: "" },
  { terme: "die Mülltrennung", definition: "tri des déchets", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "wegwerfen", definition: "jeter", type: "" },
  { terme: "abholzen", definition: "déboiser", type: "" },
  { terme: "aussterben", definition: "disparaître en tant qu'espèce", type: "" },
  { terme: "einsparen", definition: "réduire une consommation", type: "" },
  { terme: "auftauen", definition: "dégeler", type: "" },
  { terme: "austrocknen", definition: "s'assécher", type: "" },
  { terme: "freisetzen", definition: "relâcher dans l'air ou l'eau", type: "" },
  { terme: "anpflanzen", definition: "planter", type: "" },
  { terme: "ausrotten", definition: "éradiquer", type: "" },
  { terme: "aufbereiten", definition: "traiter pour réutiliser", type: "" },
  { terme: "ansteigen", definition: "monter (niveau, température)", type: "" },
  { terme: "aufforsten", definition: "reboiser", type: "" },
  { terme: "ausstoßen", definition: "émettre", type: "" },
  { terme: "einsickern", definition: "s'infiltrer dans le sol", type: "" },
  { terme: "zurückgehen", definition: "reculer ou diminuer", type: "" },
  // —— 20 expressions ——
  { terme: "ein Tropfen auf den heißen Stein", definition: "mesure sans effet réel", type: "expression" },
  { terme: "die Spitze des Eisbergs", definition: "partie visible d'un problème bien plus grand", type: "expression" },
  { terme: "im grünen Bereich sein", definition: "rester dans des limites acceptables", type: "expression" },
  { terme: "gegen den Strom schwimmen", definition: "aller contre le courant général", type: "expression" },
  { terme: "ins Wasser fallen", definition: "tomber à l'eau", type: "expression" },
  { terme: "Öl ins Feuer gießen", definition: "envenimer un conflit", type: "expression" },
  { terme: "aus der Luft gegriffen sein", definition: "être sans fondement", type: "expression" },
  { terme: "den Wald vor lauter Bäumen nicht sehen", definition: "manquer l'essentiel à force de détails", type: "expression" },
  { terme: "die Flinte ins Korn werfen", definition: "abandonner trop vite", type: "expression" },
  { terme: "Schnee von gestern sein", definition: "ne plus avoir d'actualité", type: "expression" },
  { terme: "auf dem Holzweg sein", definition: "faire fausse route", type: "expression" },
  { terme: "einen Rat in den Wind schlagen", definition: "ignorer un conseil", type: "expression" },
  { terme: "wie Pilze aus dem Boden schießen", definition: "apparaître en très grand nombre", type: "expression" },
  { terme: "reinen Tisch machen", definition: "régler une affaire jusqu'au bout", type: "expression" },
  { terme: "das Kind mit dem Bade ausschütten", definition: "rejeter aussi ce qui était utile", type: "expression" },
  { terme: "etwas auf Eis legen", definition: "suspendre un projet", type: "expression" },
  { terme: "vom Regen in die Traufe kommen", definition: "aller de mal en pis", type: "expression" },
  { terme: "Land sehen", definition: "entrevoir la fin d'une difficulté", type: "expression" },
  { terme: "die Luft ist rein", definition: "voie libre", type: "expression" },
  { terme: "eine Lawine lostreten", definition: "déclencher une cascade d'événements", type: "expression" },
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
