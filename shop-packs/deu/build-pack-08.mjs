/**
 * Pack 8 — Études & école (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Schule", definition: "école", type: "" },
  { terme: "die Klasse", definition: "classe", type: "" },
  { terme: "der Schüler", definition: "élève", type: "" },
  { terme: "der Lehrer", definition: "professeur", type: "" },
  { terme: "die Unterrichtsstunde", definition: "heure de cours", type: "" },
  { terme: "die Klassenarbeit", definition: "devoir sur table", type: "" },
  { terme: "die Schulnote", definition: "note scolaire", type: "" },
  { terme: "die Prüfung", definition: "examen", type: "" },
  { terme: "der Aufsatz", definition: "rédaction", type: "" },
  { terme: "das Buch", definition: "livre", type: "" },
  { terme: "der Kugelschreiber", definition: "stylo", type: "" },
  { terme: "der Bleistift", definition: "crayon", type: "" },
  { terme: "das Lineal", definition: "règle", type: "" },
  { terme: "der Radiergummi", definition: "gomme", type: "" },
  { terme: "die Turnhalle", definition: "gymnase", type: "" },
  { terme: "das Schulhalbjahr", definition: "semestre scolaire", type: "" },
  { terme: "die Pause", definition: "récréation", type: "" },
  { terme: "die Mitschrift", definition: "notes prises en cours", type: "" },
  { terme: "die Tafel", definition: "tableau", type: "" },
  { terme: "das Schulfach", definition: "matière", type: "" },
  { terme: "der Nachhilfelehrer", definition: "professeur particulier", type: "" },
  { terme: "der Campus", definition: "campus", type: "" },
  { terme: "die Vorlesung", definition: "cours magistral", type: "" },
  { terme: "das Seminar", definition: "séminaire", type: "" },
  { terme: "die Abschlussarbeit", definition: "mémoire", type: "" },
  { terme: "der Studienabschluss", definition: "diplôme de fin d'études", type: "" },
  { terme: "die Urkunde", definition: "diplôme officiel", type: "" },
  { terme: "die Bibliothek", definition: "bibliothèque", type: "" },
  { terme: "die Ausleihe", definition: "prêt de documents", type: "" },
  { terme: "fehlen", definition: "être absent", type: "" },
  { terme: "schummeln", definition: "tricher", type: "" },
  { terme: "bestehen", definition: "réussir un examen", type: "" },
  { terme: "die Kopie", definition: "photocopie", type: "" },
  { terme: "der Entwurf", definition: "brouillon", type: "" },
  { terme: "das Zitat", definition: "citation", type: "" },
  { terme: "buchstabieren", definition: "épeler", type: "" },
  { terme: "die mündliche Prüfung", definition: "épreuve orale", type: "" },
  { terme: "das Zeugnis", definition: "bulletin scolaire", type: "" },
  { terme: "das Schließfach", definition: "casier", type: "" },
  { terme: "die Mensa", definition: "restaurant universitaire", type: "" },
  { terme: "der Schulranzen", definition: "cartable", type: "" },
  { terme: "die Prüfungsvorbereitung", definition: "révisions d'examen", type: "" },
  { terme: "das Stipendium", definition: "bourse d'études", type: "" },
  { terme: "das Plagiat", definition: "plagiat", type: "" },
  { terme: "die Anwesenheit", definition: "présence en cours", type: "" },
  { terme: "der Tadel", definition: "blâme", type: "" },
  { terme: "der Erstsemester", definition: "étudiant de première année", type: "" },
  { terme: "der Absolvent", definition: "diplômé", type: "" },
  { terme: "der Schulleiter", definition: "chef d'établissement", type: "" },
  { terme: "der Schulausflug", definition: "sortie scolaire", type: "" },
  { terme: "der Tag der offenen Tür", definition: "journée portes ouvertes", type: "" },
  { terme: "das Zwischenjahr", definition: "année de césure", type: "" },
  { terme: "die Lernstrategie", definition: "méthode de travail", type: "" },
  { terme: "die Probeklausur", definition: "examen blanc", type: "" },
  { terme: "der Stundenplan", definition: "emploi du temps", type: "" },
  { terme: "die Kreide", definition: "craie", type: "" },
  { terme: "das Arbeitsblatt", definition: "feuille d'exercices", type: "" },
  { terme: "das Diktat", definition: "dictée", type: "" },
  { terme: "der Fachraum", definition: "salle spécialisée", type: "" },
  { terme: "das Gymnasium", definition: "lycée en Allemagne, pas une salle de sport", type: "" },
  { terme: "das Abitur", definition: "baccalauréat allemand", type: "" },
  { terme: "die Hausaufgabe", definition: "devoir à faire à la maison", type: "" },
  { terme: "das Lehrerzimmer", definition: "salle des professeurs", type: "" },
  { terme: "der Kurs", definition: "module de cours", type: "" },
  { terme: "das Referat", definition: "exposé", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "aufpassen", definition: "être attentif", type: "" },
  { terme: "abschreiben", definition: "copier", type: "" },
  { terme: "nachholen", definition: "rattraper un cours manqué", type: "" },
  { terme: "ausarbeiten", definition: "rédiger un travail", type: "" },
  { terme: "vorlesen", definition: "lire à voix haute", type: "" },
  { terme: "mitkommen", definition: "suivre le rythme du cours", type: "" },
  { terme: "abfragen", definition: "interroger sur une leçon", type: "" },
  { terme: "aufgeben", definition: "donner un devoir", type: "" },
  { terme: "eintragen", definition: "inscrire dans le carnet", type: "" },
  { terme: "durchfallen", definition: "échouer à un examen", type: "" },
  { terme: "nachbereiten", definition: "revoir un cours après coup", type: "" },
  { terme: "vorbereiten", definition: "préparer", type: "" },
  { terme: "aufschreiben", definition: "noter par écrit", type: "" },
  { terme: "teilnehmen", definition: "prendre part", type: "" },
  { terme: "nachsitzen", definition: "rester après les cours", type: "" },
  // —— 20 expressions ——
  { terme: "mit Bravour bestehen", definition: "réussir haut la main", type: "expression" },
  { terme: "die Nase in die Bücher stecken", definition: "se plonger dans les révisions", type: "expression" },
  { terme: "der Liebling des Lehrers", definition: "chouchou du professeur", type: "expression" },
  { terme: "zurück auf Anfang", definition: "devoir tout reprendre au début", type: "expression" },
  { terme: "die Nacht durchmachen", definition: "passer la nuit sans dormir", type: "expression" },
  { terme: "die Schule des Lebens", definition: "l'école de la vie", type: "expression" },
  { terme: "der Klassenprimus", definition: "premier de la classe", type: "expression" },
  { terme: "die Kurve kriegen", definition: "s'en sortir de justesse", type: "expression" },
  { terme: "eine steile Lernkurve", definition: "un apprentissage raide au début", type: "expression" },
  { terme: "auswendig können", definition: "savoir par cœur", type: "expression" },
  { terme: "alle Register ziehen", definition: "utiliser toutes ses ressources", type: "expression" },
  { terme: "die Leviten lesen", definition: "passer un savon", type: "expression" },
  { terme: "die Latte hoch legen", definition: "fixer un niveau élevé", type: "expression" },
  { terme: "Wort für Wort", definition: "mot pour mot", type: "expression" },
  { terme: "eine schnelle Auffassungsgabe haben", definition: "comprendre très vite", type: "expression" },
  { terme: "sich einen Schnitzer leisten", definition: "commettre une erreur visible", type: "expression" },
  { terme: "eine Klasse für sich sein", definition: "être sans équivalent", type: "expression" },
  { terme: "etwas im Schlaf beherrschen", definition: "maîtriser sans avoir à réfléchir", type: "expression" },
  { terme: "den Grips anstrengen", definition: "se creuser la tête", type: "expression" },
  { terme: "eine Eins schreiben", definition: "obtenir la meilleure note", type: "expression" },
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
