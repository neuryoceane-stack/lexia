/**
 * Pack 10 — Culture & arts (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "il film", definition: "film", type: "" },
  { terme: "il regista", definition: "réalisateur", type: "" },
  { terme: "l'attore (m.)", definition: "acteur", type: "" },
  { terme: "l'attrice (f.)", definition: "actrice", type: "" },
  { terme: "la scena", definition: "scène", type: "" },
  { terme: "il palcoscenico", definition: "plateau, la scène du théâtre", type: "" },
  { terme: "il museo", definition: "musée", type: "" },
  { terme: "il quadro", definition: "tableau peint", type: "" },
  { terme: "la mostra", definition: "exposition", type: "" },
  { terme: "il romanzo", definition: "roman", type: "" },
  { terme: "la poesia", definition: "poésie", type: "" },
  { terme: "il teatro", definition: "théâtre", type: "" },
  { terme: "il concerto", definition: "concert", type: "" },
  { terme: "la canzone", definition: "chanson", type: "" },
  { terme: "lo strumento", definition: "instrument de musique", type: "" },
  { terme: "il pittore", definition: "peintre", type: "" },
  { terme: "lo scultore", definition: "sculpteur", type: "" },
  { terme: "l'opera d'arte (f.)", definition: "œuvre d'art", type: "" },
  { terme: "l'opera lirica (f.)", definition: "opéra, le genre lyrique", type: "" },
  { terme: "il pubblico", definition: "public", type: "" },
  { terme: "l'applauso (m.)", definition: "applaudissement", type: "" },
  { terme: "la trama", definition: "intrigue", type: "" },
  { terme: "il personaggio", definition: "personnage", type: "" },
  { terme: "il capitolo", definition: "chapitre", type: "" },
  { terme: "l'autore (m.)", definition: "auteur", type: "" },
  { terme: "la critica", definition: "critique, le jugement sur une œuvre", type: "" },
  { terme: "il patrimonio artistico", definition: "patrimoine artistique", type: "" },
  { terme: "il Rinascimento", definition: "Renaissance", type: "" },
  { terme: "il fumetto", definition: "bande dessinée", type: "" },
  { terme: "il doppiaggio", definition: "doublage d'un film", type: "" },
  { terme: "i sottotitoli", definition: "sous-titres", type: "" },
  { terme: "la colonna sonora", definition: "bande originale", type: "" },
  { terme: "il genere", definition: "genre artistique", type: "" },
  { terme: "la platea", definition: "fauteuils d'orchestre", type: "" },
  { terme: "la galleria d'arte", definition: "galerie d'art", type: "" },
  { terme: "il biglietto dello spettacolo", definition: "billet pour un spectacle", type: "" },
  { terme: "la prova generale", definition: "répétition générale", type: "" },
  { terme: "il copione", definition: "script", type: "" },
  { terme: "la battuta", definition: "réplique", type: "" },
  { terme: "il ruolo", definition: "rôle", type: "" },
  { terme: "il soprano", definition: "soprano", type: "" },
  { terme: "l'orchestra (f.)", definition: "orchestre", type: "" },
  { terme: "il direttore d'orchestra", definition: "chef d'orchestre", type: "" },
  { terme: "la tela", definition: "toile", type: "" },
  { terme: "il pennello", definition: "pinceau", type: "" },
  { terme: "la scultura", definition: "sculpture", type: "" },
  { terme: "l'affresco (m.)", definition: "fresque", type: "" },
  { terme: "il monumento", definition: "monument", type: "" },
  { terme: "la tradizione", definition: "tradition", type: "" },
  { terme: "il folklore", definition: "folklore", type: "" },
  { terme: "la festa patronale", definition: "fête du saint patron d'une ville", type: "" },
  { terme: "il carnevale", definition: "carnaval", type: "" },
  { terme: "la maschera", definition: "masque", type: "" },
  { terme: "il dialetto", definition: "dialecte", type: "" },
  { terme: "la strofa", definition: "strophe", type: "" },
  { terme: "la rima", definition: "rime", type: "" },
  { terme: "il narratore", definition: "narrateur", type: "" },
  { terme: "il finale", definition: "dénouement", type: "" },
  { terme: "lo spettacolo", definition: "spectacle", type: "" },
  { terme: "la sala cinematografica", definition: "salle de cinéma", type: "" },
  { terme: "il festival", definition: "festival", type: "" },
  { terme: "l'ispirazione (f.)", definition: "inspiration", type: "" },
  { terme: "il capolavoro", definition: "chef-d'œuvre", type: "" },
  { terme: "la bozza", definition: "brouillon", type: "" },
  { terme: "il restauro", definition: "restauration d'une œuvre", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "recitare", definition: "jouer un rôle", type: "" },
  { terme: "dipingere", definition: "peindre", type: "" },
  { terme: "scolpire", definition: "sculpter", type: "" },
  { terme: "suonare", definition: "jouer d'un instrument", type: "" },
  { terme: "cantare", definition: "chanter", type: "" },
  { terme: "esibirsi", definition: "se produire en public", type: "" },
  { terme: "applaudire", definition: "applaudir", type: "" },
  { terme: "fischiare", definition: "siffler un spectacle", type: "" },
  { terme: "provare una scena", definition: "répéter une scène", type: "" },
  { terme: "pubblicare un libro", definition: "faire paraître un livre", type: "" },
  { terme: "tradurre", definition: "traduire", type: "" },
  { terme: "dedicare", definition: "dédicacer, ou dédier une œuvre", type: "" },
  { terme: "ispirarsi", definition: "s'inspirer", type: "" },
  { terme: "restaurare", definition: "restaurer une œuvre", type: "" },
  { terme: "girare un film", definition: "tourner un film", type: "" },
  // —— 20 expressions ——
  { terme: "calare il sipario", definition: "mettre un terme à une affaire", type: "expression" },
  { terme: "rubare la scena", definition: "attirer toute l'attention sur soi", type: "expression" },
  { terme: "essere musica per le orecchie", definition: "être une nouvelle très agréable à entendre", type: "expression" },
  { terme: "cambiare disco", definition: "cesser de répéter la même chose", type: "expression" },
  { terme: "essere un libro aperto", definition: "être facile à déchiffrer", type: "expression" },
  { terme: "l'abito non fa il monaco", definition: "l'apparence ne dit pas qui est la personne", type: "expression" },
  { terme: "a ogni uccello il suo nido è bello", definition: "trouver admirable ce qui nous appartient", type: "expression" },
  { terme: "un colpo di scena", definition: "retournement brusque d'une situation", type: "expression" },
  { terme: "finire in bellezza", definition: "terminer sur une très bonne note", type: "expression" },
  { terme: "tirare le fila", definition: "mener une affaire depuis l'ombre", type: "expression" },
  { terme: "entrare in scena", definition: "commencer à agir au grand jour", type: "expression" },
  { terme: "fare fiasco", definition: "essuyer un échec complet", type: "expression" },
  { terme: "restare a bocca aperta", definition: "rester sans voix devant quelque chose", type: "expression" },
  { terme: "paese che vai, usanza che trovi", definition: "chaque endroit a ses habitudes", type: "expression" },
  { terme: "avere occhio", definition: "avoir le sens du détail juste", type: "expression" },
  { terme: "recitare a soggetto", definition: "improviser sans texte préparé", type: "expression" },
  { terme: "prendersi la parte del leone", definition: "s'attribuer la plus grosse part", type: "expression" },
  { terme: "dare spettacolo", definition: "se donner en spectacle", type: "expression" },
  { terme: "tutto il mondo è paese", definition: "les mêmes comportements se retrouvent partout", type: "expression" },
  { terme: "dare il la", definition: "donner le ton", type: "expression" },
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
