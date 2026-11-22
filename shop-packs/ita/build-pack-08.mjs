/**
 * Pack 8 — Études & école (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la scuola", definition: "école", type: "" },
  { terme: "l'aula (f.)", definition: "salle de classe", type: "" },
  { terme: "il liceo", definition: "lycée", type: "" },
  { terme: "l'esame di Stato (m.)", definition: "baccalauréat italien, aussi appelé maturità", type: "" },
  { terme: "l'interrogazione (f.)", definition: "oral de contrôle en classe", type: "" },
  { terme: "il compito in classe", definition: "devoir sur table", type: "" },
  { terme: "i compiti", definition: "devoirs à faire à la maison", type: "" },
  { terme: "la sufficienza", definition: "note suffisante, le 6 sur 10", type: "" },
  { terme: "l'insufficienza (f.)", definition: "note en dessous de la moyenne", type: "" },
  { terme: "la pagella", definition: "bulletin scolaire", type: "" },
  { terme: "il voto", definition: "note sur 10 ; une voix électorale se dit voto elettorale", type: "" },
  { terme: "la media", definition: "moyenne des notes", type: "" },
  { terme: "il registro", definition: "cahier d'appel de la classe", type: "" },
  { terme: "il bidello", definition: "agent chargé de l'entretien dans une école", type: "" },
  { terme: "la verifica", definition: "contrôle écrit", type: "" },
  { terme: "il professore", definition: "enseignant du secondaire", type: "" },
  { terme: "la materia", definition: "matière scolaire", type: "" },
  { terme: "il compagno di banco", definition: "camarade de table", type: "" },
  { terme: "la ripetizione", definition: "cours particulier", type: "" },
  { terme: "il debito formativo", definition: "matière non validée, à rattraper", type: "" },
  { terme: "l'università (f.)", definition: "université", type: "" },
  { terme: "la laurea", definition: "diplôme de fin d'études universitaires", type: "" },
  { terme: "la laurea magistrale", definition: "master", type: "" },
  { terme: "il quadrimestre", definition: "période du calendrier scolaire italien", type: "" },
  { terme: "la lezione", definition: "cours, l'heure de classe", type: "" },
  { terme: "l'intervallo (m.)", definition: "récréation", type: "" },
  { terme: "lo zaino", definition: "sac à dos", type: "" },
  { terme: "la penna", definition: "stylo", type: "" },
  { terme: "il quaderno", definition: "cahier", type: "" },
  { terme: "la matita", definition: "crayon", type: "" },
  { terme: "la lavagna", definition: "tableau de classe", type: "" },
  { terme: "il gesso", definition: "craie, ou plâtre d'une fracture", type: "" },
  { terme: "l'esame (m.)", definition: "examen", type: "" },
  { terme: "il colloquio d'esame", definition: "oral d'un examen", type: "" },
  { terme: "la borsa di studio", definition: "bourse d'études", type: "" },
  { terme: "la biblioteca", definition: "bibliothèque où l'on emprunte des livres", type: "" },
  { terme: "la libreria", definition: "librairie, ou le meuble à livres ; pas une bibliothèque", type: "" },
  { terme: "il preside", definition: "chef d'établissement", type: "" },
  { terme: "il consiglio di classe", definition: "conseil de classe", type: "" },
  { terme: "la gita scolastica", definition: "sortie scolaire", type: "" },
  { terme: "l'orientamento (m.)", definition: "choix d'une filière d'études", type: "" },
  { terme: "la facoltà", definition: "faculté universitaire", type: "" },
  { terme: "lo studente", definition: "étudiant", type: "" },
  { terme: "l'iscrizione (f.)", definition: "inscription dans un établissement", type: "" },
  { terme: "la retta", definition: "frais de scolarité", type: "" },
  { terme: "il riassunto", definition: "résumé", type: "" },
  { terme: "il tema", definition: "dissertation", type: "" },
  { terme: "la traduzione", definition: "traduction", type: "" },
  { terme: "la versione", definition: "exercice de version, vers l'italien", type: "" },
  { terme: "il dettato", definition: "dictée", type: "" },
  { terme: "l'appello (m.)", definition: "session d'examen à l'université ; en classe, fare l'appello signifie faire l'appel", type: "" },
  { terme: "il libretto", definition: "livret où sont inscrites les notes universitaires", type: "" },
  { terme: "il credito", definition: "crédit d'un cours validé", type: "" },
  { terme: "la campanella", definition: "sonnerie de l'école", type: "" },
  { terme: "la condotta", definition: "appréciation du comportement", type: "" },
  { terme: "il laboratorio", definition: "salle de travaux pratiques", type: "" },
  { terme: "l'orario delle lezioni (m.)", definition: "emploi du temps", type: "" },
  { terme: "la ricerca", definition: "exposé ou dossier à préparer", type: "" },
  { terme: "la presentazione", definition: "exposé oral", type: "" },
  { terme: "il compagno di classe", definition: "camarade de classe", type: "" },
  { terme: "la maestra", definition: "enseignante de l'école primaire", type: "" },
  { terme: "il dizionario", definition: "dictionnaire", type: "" },
  { terme: "l'astuccio (m.)", definition: "trousse", type: "" },
  { terme: "il corso di recupero", definition: "cours de rattrapage", type: "" },
  { terme: "il registro elettronico", definition: "registre en ligne des notes et des absences", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "studiare", definition: "étudier", type: "" },
  { terme: "ripassare", definition: "réviser", type: "" },
  { terme: "sostenere un esame", definition: "passer une épreuve", type: "" },
  { terme: "bocciare", definition: "recaler un élève", type: "" },
  { terme: "promuovere", definition: "faire passer dans la classe supérieure", type: "" },
  { terme: "iscriversi a un corso", definition: "s'inscrire à un cours", type: "" },
  { terme: "copiare", definition: "recopier la copie d'un camarade", type: "" },
  { terme: "prendere appunti", definition: "prendre des notes", type: "" },
  { terme: "consegnare il compito", definition: "rendre un devoir", type: "" },
  { terme: "interrogare", definition: "faire passer un oral en classe", type: "" },
  { terme: "alzare la mano", definition: "lever la main pour demander la parole", type: "" },
  { terme: "marinare la scuola", definition: "sécher les cours", type: "" },
  { terme: "laurearsi", definition: "obtenir le diplôme de fin d'université", type: "" },
  { terme: "ripetere l'anno", definition: "redoubler", type: "" },
  { terme: "concentrarsi", definition: "se concentrer", type: "" },
  // —— 20 expressions ——
  { terme: "conoscere a menadito", definition: "maîtriser un sujet dans tous ses détails", type: "expression" },
  { terme: "avere la testa fra le nuvole", definition: "être distrait, penser à autre chose", type: "expression" },
  { terme: "non capire un'acca", definition: "ne rien comprendre du tout", type: "expression" },
  { terme: "essere un secchione", definition: "travailler sans relâche, au point d'être moqué", type: "expression" },
  { terme: "imparare a proprie spese", definition: "apprendre en subissant les conséquences", type: "expression" },
  { terme: "chi dorme non piglia pesci", definition: "qui ne tente rien n'obtient rien", type: "expression" },
  { terme: "a pieni voti", definition: "avec une réussite sans réserve", type: "expression" },
  { terme: "perdere il filo", definition: "ne plus suivre son raisonnement", type: "expression" },
  { terme: "essere una cima", definition: "exceller dans un domaine", type: "expression" },
  { terme: "essere una frana", definition: "être très faible dans un domaine", type: "expression" },
  { terme: "in bocca al lupo", definition: "souhaiter bonne chance, surtout avant une épreuve", type: "expression" },
  { terme: "crepi il lupo", definition: "réponse rituelle à un souhait de bonne chance", type: "expression" },
  { terme: "non entrare in testa", definition: "refuser de rester en mémoire", type: "expression" },
  { terme: "avere un vuoto di memoria", definition: "avoir un trou au moment de se souvenir", type: "expression" },
  { terme: "sapere il fatto suo", definition: "maîtriser vraiment ce qu'on fait", type: "expression" },
  { terme: "essere tagliato per", definition: "avoir les dispositions pour une voie", type: "expression" },
  { terme: "tornare sui banchi", definition: "reprendre des études", type: "expression" },
  { terme: "sbagliando si impara", definition: "progresser grâce à ses erreurs", type: "expression" },
  { terme: "meglio tardi che mai", definition: "valoir mieux en retard que pas du tout", type: "expression" },
  { terme: "bruciare le tappe", definition: "aller plus vite que les étapes prévues", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-08-etudes-ecole.xlsx"));
