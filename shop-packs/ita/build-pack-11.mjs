/**
 * Pack 11 — Sport & loisirs (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "lo sport", definition: "sport", type: "" },
  { terme: "il calcio", definition: "football", type: "" },
  { terme: "la pallacanestro", definition: "basket-ball", type: "" },
  { terme: "la pallavolo", definition: "volley-ball", type: "" },
  { terme: "il nuoto", definition: "natation", type: "" },
  { terme: "l'atletica (f.)", definition: "athlétisme", type: "" },
  { terme: "lo sci", definition: "ski", type: "" },
  { terme: "il ciclismo", definition: "cyclisme", type: "" },
  { terme: "la squadra", definition: "équipe sportive", type: "" },
  { terme: "l'allenamento (m.)", definition: "entraînement", type: "" },
  { terme: "l'allenatore (m.)", definition: "entraîneur", type: "" },
  { terme: "la partita", definition: "match", type: "" },
  { terme: "il campionato", definition: "championnat", type: "" },
  { terme: "il campione", definition: "champion", type: "" },
  { terme: "il gol", definition: "but marqué", type: "" },
  { terme: "la porta da calcio", definition: "cage de but ; porta seul veut aussi dire porte", type: "" },
  { terme: "l'arbitro (m.)", definition: "arbitre", type: "" },
  { terme: "il campo", definition: "terrain de jeu", type: "" },
  { terme: "la palestra", definition: "salle de sport", type: "" },
  { terme: "la piscina", definition: "piscine", type: "" },
  { terme: "lo stadio", definition: "stade", type: "" },
  { terme: "la vittoria", definition: "victoire", type: "" },
  { terme: "la sconfitta", definition: "défaite", type: "" },
  { terme: "il pareggio", definition: "match nul", type: "" },
  { terme: "la medaglia", definition: "médaille", type: "" },
  { terme: "le Olimpiadi", definition: "Jeux olympiques", type: "" },
  { terme: "il tifoso", definition: "supporteur", type: "" },
  { terme: "la finale", definition: "finale", type: "" },
  { terme: "il rigore", definition: "penalty", type: "" },
  { terme: "il fuorigioco", definition: "hors-jeu", type: "" },
  { terme: "l'infortunio (m.)", definition: "blessure survenue en faisant du sport", type: "" },
  { terme: "il cartellino rosso", definition: "carton rouge", type: "" },
  { terme: "il cartellino giallo", definition: "carton jaune", type: "" },
  { terme: "il pallone", definition: "ballon", type: "" },
  { terme: "la racchetta", definition: "raquette", type: "" },
  { terme: "la pista di atletica", definition: "piste d'athlétisme", type: "" },
  { terme: "il traguardo", definition: "ligne d'arrivée", type: "" },
  { terme: "la classifica", definition: "classement", type: "" },
  { terme: "il record", definition: "record", type: "" },
  { terme: "il cronometro", definition: "chronomètre", type: "" },
  { terme: "il riscaldamento muscolare", definition: "échauffement", type: "" },
  { terme: "la staffetta", definition: "course de relais", type: "" },
  { terme: "il salto", definition: "saut", type: "" },
  { terme: "la maratona", definition: "marathon", type: "" },
  { terme: "l'escursionismo (m.)", definition: "randonnée", type: "" },
  { terme: "il sentiero", definition: "sentier", type: "" },
  { terme: "la tenda da campeggio", definition: "tente de camping", type: "" },
  { terme: "lo zaino da trekking", definition: "sac à dos de randonnée", type: "" },
  { terme: "il tempo libero", definition: "temps libre", type: "" },
  { terme: "il passatempo", definition: "passe-temps", type: "" },
  { terme: "il gioco da tavolo", definition: "jeu de société", type: "" },
  { terme: "gli scacchi", definition: "échecs", type: "" },
  { terme: "la briscola", definition: "jeu de cartes italien très courant", type: "" },
  { terme: "il torneo", definition: "tournoi", type: "" },
  { terme: "la tifoseria", definition: "groupe de supporteurs", type: "" },
  { terme: "lo spogliatoio", definition: "vestiaire", type: "" },
  { terme: "la divisa", definition: "tenue de sport", type: "" },
  { terme: "il capitano", definition: "capitaine d'équipe", type: "" },
  { terme: "la panchina", definition: "banc de touche", type: "" },
  { terme: "il supplementare", definition: "prolongation", type: "" },
  { terme: "i calci di rigore", definition: "séance de tirs au but", type: "" },
  { terme: "il pubblico dello stadio", definition: "spectateurs dans les tribunes", type: "" },
  { terme: "la curva", definition: "virage du stade occupé par les supporteurs", type: "" },
  { terme: "lo scudetto", definition: "titre de champion d'Italie", type: "" },
  { terme: "il fair play", definition: "jeu loyal", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "allenarsi", definition: "s'entraîner", type: "" },
  { terme: "vincere", definition: "gagner une rencontre", type: "" },
  { terme: "perdere la partita", definition: "perdre un match", type: "" },
  { terme: "pareggiare", definition: "faire match nul", type: "" },
  { terme: "segnare", definition: "marquer un but", type: "" },
  { terme: "tifare", definition: "supporter une équipe", type: "" },
  { terme: "arbitrare", definition: "arbitrer", type: "" },
  { terme: "infortunarsi", definition: "se blesser en jouant", type: "" },
  { terme: "riscaldarsi", definition: "s'échauffer", type: "" },
  { terme: "rimontare", definition: "revenir au score", type: "" },
  { terme: "qualificarsi", definition: "se qualifier", type: "" },
  { terme: "arrendersi", definition: "s'avouer vaincu", type: "" },
  { terme: "stirarsi", definition: "s'étirer après l'effort", type: "" },
  { terme: "battere un record", definition: "battre un record", type: "" },
  { terme: "dare il cambio", definition: "entrer en jeu à la place d'un coéquipier", type: "" },
  // —— 20 expressions ——
  { terme: "gettare la spugna", definition: "abandonner avant la fin", type: "expression" },
  { terme: "sul filo di lana", definition: "l'emporter de justesse", type: "expression" },
  { terme: "fare autogol", definition: "se causer du tort à soi-même", type: "expression" },
  { terme: "essere in fuorigioco", definition: "être dépassé, hors du coup", type: "expression" },
  { terme: "avere la vittoria in pugno", definition: "tenir la réussite pour acquise", type: "expression" },
  { terme: "giocare in casa", definition: "évoluer dans un cadre qui vous avantage", type: "expression" },
  { terme: "stare al gioco", definition: "accepter les règles du moment", type: "expression" },
  { terme: "tirare la volata", definition: "mener la dernière ligne droite", type: "expression" },
  { terme: "salvare la faccia", definition: "préserver sa réputation après un revers", type: "expression" },
  { terme: "cadere in piedi", definition: "se sortir d'un échec sans trop de mal", type: "expression" },
  { terme: "incassare il colpo", definition: "absorber un choc sans flancher", type: "expression" },
  { terme: "colpire sotto la cintura", definition: "agir de façon déloyale", type: "expression" },
  { terme: "perdere terreno", definition: "se faire distancer", type: "expression" },
  { terme: "tenere palla", definition: "faire durer pour gagner du temps", type: "expression" },
  { terme: "cantare vittoria", definition: "s'annoncer gagnant trop tôt", type: "expression" },
  { terme: "stringere i denti", definition: "endurer sans se plaindre", type: "expression" },
  { terme: "battere sul tempo", definition: "devancer quelqu'un de justesse", type: "expression" },
  { terme: "dare forfait", definition: "renoncer à participer", type: "expression" },
  { terme: "testa a testa", definition: "être au coude à coude", type: "expression" },
  { terme: "scaricare il barile", definition: "rejeter la faute sur un autre", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-11-sport-loisirs.xlsx"));
