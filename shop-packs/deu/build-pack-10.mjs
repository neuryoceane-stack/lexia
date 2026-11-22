/**
 * Pack 10 — Culture & arts (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "der Film", definition: "film", type: "" },
  { terme: "das Kino", definition: "cinéma", type: "" },
  { terme: "der Schauspieler", definition: "acteur", type: "" },
  { terme: "die Rolle", definition: "rôle", type: "" },
  { terme: "das Drehbuch", definition: "scénario", type: "" },
  { terme: "die Szene", definition: "scène d'un film", type: "" },
  { terme: "der Regisseur", definition: "réalisateur", type: "" },
  { terme: "die Musik", definition: "musique", type: "" },
  { terme: "das Lied", definition: "chanson", type: "" },
  { terme: "der Rhythmus", definition: "rythme", type: "" },
  { terme: "die Band", definition: "groupe de musique", type: "" },
  { terme: "das Konzert", definition: "concert", type: "" },
  { terme: "das Theater", definition: "théâtre", type: "" },
  { terme: "das Theaterstück", definition: "pièce de théâtre", type: "" },
  { terme: "die Bühne", definition: "plateau", type: "" },
  { terme: "der Bühnenvorhang", definition: "rideau de scène", type: "" },
  { terme: "die Ausstellung", definition: "exposition", type: "" },
  { terme: "das Gemälde", definition: "tableau peint", type: "" },
  { terme: "der Künstler", definition: "artiste", type: "" },
  { terme: "die Kunst", definition: "art", type: "" },
  { terme: "das Museum", definition: "musée", type: "" },
  { terme: "die Skulptur", definition: "sculpture", type: "" },
  { terme: "der Roman", definition: "roman", type: "" },
  { terme: "der Dichter", definition: "poète", type: "" },
  { terme: "das Gedicht", definition: "poème", type: "" },
  { terme: "der Verlag", definition: "maison d'édition", type: "" },
  { terme: "der Bestseller", definition: "succès de librairie", type: "" },
  { terme: "die Kritik", definition: "critique", type: "" },
  { terme: "der Beifall", definition: "applaudissements", type: "" },
  { terme: "die Zugabe", definition: "rappel demandé au spectacle", type: "" },
  { terme: "die Probe", definition: "répétition", type: "" },
  { terme: "das Publikum", definition: "public", type: "" },
  { terme: "die Eintrittskarte", definition: "billet d'entrée", type: "" },
  { terme: "die Premiere", definition: "première", type: "" },
  { terme: "der Dokumentarfilm", definition: "long métrage documentaire", type: "" },
  { terme: "die Synchronfassung", definition: "version doublée", type: "" },
  { terme: "der Soundtrack", definition: "bande originale", type: "" },
  { terme: "die Note", definition: "note de musique", type: "" },
  { terme: "das Instrument", definition: "instrument de musique", type: "" },
  { terme: "die Geige", definition: "violon", type: "" },
  { terme: "das Klavier", definition: "piano", type: "" },
  { terme: "die Oper", definition: "opéra", type: "" },
  { terme: "der Tanz", definition: "danse", type: "" },
  { terme: "die Galerie", definition: "galerie d'art", type: "" },
  { terme: "das Atelier", definition: "atelier d'artiste", type: "" },
  { terme: "die Architektur", definition: "architecture", type: "" },
  { terme: "das Denkmal", definition: "monument", type: "" },
  { terme: "das Kulturerbe", definition: "patrimoine culturel", type: "" },
  { terme: "die Tradition", definition: "tradition", type: "" },
  { terme: "der Brauch", definition: "coutume", type: "" },
  { terme: "das Festival", definition: "festival", type: "" },
  { terme: "die Auszeichnung", definition: "récompense", type: "" },
  { terme: "die Jury", definition: "jury d'un concours", type: "" },
  { terme: "die Handlung", definition: "intrigue", type: "" },
  { terme: "der Cliffhanger", definition: "fin d'épisode qui laisse en suspens", type: "" },
  { terme: "die Serienstaffel", definition: "saison d'une série", type: "" },
  { terme: "die Folge", definition: "épisode", type: "" },
  { terme: "der Abspann", definition: "générique de fin", type: "" },
  { terme: "die Leinwand", definition: "écran de cinéma", type: "" },
  { terme: "der Pinsel", definition: "pinceau", type: "" },
  { terme: "die Farbe", definition: "couleur", type: "" },
  { terme: "die Staffelei", definition: "chevalet", type: "" },
  { terme: "die Skizze", definition: "esquisse", type: "" },
  { terme: "zeitgenössisch", definition: "contemporain", type: "" },
  { terme: "der Klassiker", definition: "classique", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "aufführen", definition: "jouer une pièce", type: "" },
  { terme: "einstudieren", definition: "répéter jusqu'à savoir", type: "" },
  { terme: "mitsingen", definition: "chanter avec les autres", type: "" },
  { terme: "vortanzen", definition: "danser pour montrer", type: "" },
  { terme: "ausstellen", definition: "exposer", type: "" },
  { terme: "auflegen", definition: "passer un morceau", type: "" },
  { terme: "ausverkaufen", definition: "épuiser les places", type: "" },
  { terme: "einblenden", definition: "faire apparaître à l'image", type: "" },
  { terme: "vorspielen", definition: "jouer devant un public", type: "" },
  { terme: "umarbeiten", definition: "remanier une œuvre", type: "" },
  { terme: "vortragen", definition: "interpréter à voix haute", type: "" },
  { terme: "anspielen", definition: "entamer un morceau", type: "" },
  { terme: "ausklingen", definition: "se terminer en douceur", type: "" },
  { terme: "mitspielen", definition: "tenir un rôle", type: "" },
  { terme: "aufnehmen", definition: "enregistrer", type: "" },
  // —— 20 expressions ——
  { terme: "Hals- und Beinbruch", definition: "souhait de bonne chance avant d'entrer en scène", type: "expression" },
  { terme: "die Show stehlen", definition: "voler la vedette", type: "expression" },
  { terme: "in die Rolle schlüpfen", definition: "entrer dans la peau d'un personnage", type: "expression" },
  { terme: "den Ton angeben", definition: "donner le la", type: "expression" },
  { terme: "auf die Bühne bringen", definition: "porter devant le public", type: "expression" },
  { terme: "ein Kassenschlager sein", definition: "faire un carton", type: "expression" },
  { terme: "aus der Reihe tanzen", definition: "sortir du rang", type: "expression" },
  { terme: "die alte Leier", definition: "toujours la même rengaine", type: "expression" },
  { terme: "eine andere Saite aufziehen", definition: "se montrer plus sévère", type: "expression" },
  { terme: "Kunst kommt von Können", definition: "le talent se travaille", type: "expression" },
  { terme: "den Nagel auf den Kopf treffen", definition: "viser juste", type: "expression" },
  { terme: "eine harte Nuss", definition: "un problème difficile à résoudre", type: "expression" },
  { terme: "nicht von schlechten Eltern sein", definition: "être loin d'être mauvais", type: "expression" },
  { terme: "ein alter Hut sein", definition: "être une idée déjà vue", type: "expression" },
  { terme: "in Szene setzen", definition: "mettre en valeur", type: "expression" },
  { terme: "den Vogel abschießen", definition: "surpasser tous les autres", type: "expression" },
  { terme: "die Maske fallen lassen", definition: "révéler sa vraie nature", type: "expression" },
  { terme: "einen großen Bahnhof bereiten", definition: "réserver un accueil en grande pompe", type: "expression" },
  { terme: "nach jemandes Pfeife tanzen", definition: "obéir sans discuter", type: "expression" },
  { terme: "das Publikum mitreißen", definition: "emporter la salle", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-10-culture-arts.xlsx"));
