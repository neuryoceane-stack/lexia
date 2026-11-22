/**
 * Pack 8 — Études & école (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el colegio", definition: "école du primaire ou du collège, et non « faculté »", type: "" },
  { terme: "el instituto", definition: "lycée, et non « institut »", type: "" },
  { terme: "la librería", definition: "librairie, et non « bibliothèque »", type: "" },
  { terme: "la biblioteca", definition: "bibliothèque", type: "" },
  { terme: "la carpeta", definition: "classeur, et non « carpette »", type: "" },
  { terme: "el examen", definition: "examen", type: "" },
  { terme: "la nota", definition: "note scolaire", type: "" },
  { terme: "los deberes", definition: "devoirs à la maison", type: "" },
  { terme: "la asignatura", definition: "matière", type: "" },
  { terme: "el profesor", definition: "professeur", type: "" },
  { terme: "la pizarra", definition: "tableau", type: "" },
  { terme: "el cuaderno", definition: "cahier", type: "" },
  { terme: "el bolígrafo", definition: "stylo", type: "" },
  { terme: "la mochila", definition: "sac à dos", type: "" },
  { terme: "el recreo", definition: "récréation", type: "" },
  { terme: "la carrera universitaria", definition: "cursus universitaire", type: "" },
  { terme: "el bachillerato", definition: "cycle du lycée menant au baccalauréat", type: "" },
  { terme: "la ESO", definition: "collège, en Espagne", type: "" },
  { terme: "la EVAU", definition: "épreuve d'accès à l'université, en Espagne", type: "" },
  { terme: "el alumno", definition: "élève", type: "" },
  { terme: "la beca", definition: "bourse d'études", type: "" },
  { terme: "el aula", definition: "salle de classe (nom féminin)", type: "" },
  { terme: "el horario escolar", definition: "emploi du temps", type: "" },
  { terme: "el trimestre", definition: "trimestre", type: "" },
  { terme: "las vacaciones escolares", definition: "vacances scolaires", type: "" },
  { terme: "el suspenso", definition: "échec à une épreuve", type: "" },
  { terme: "el aprobado", definition: "résultat suffisant pour réussir", type: "" },
  { terme: "la nota media", definition: "moyenne générale", type: "" },
  { terme: "el compañero de clase", definition: "camarade de classe", type: "" },
  { terme: "el director", definition: "chef d'établissement", type: "" },
  { terme: "la tutoría", definition: "heure avec le professeur principal", type: "" },
  { terme: "el trabajo en grupo", definition: "travail de groupe", type: "" },
  { terme: "la exposición oral", definition: "exposé oral", type: "" },
  { terme: "el plazo de entrega", definition: "délai de remise", type: "" },
  { terme: "la convocatoria", definition: "session d'examen", type: "" },
  { terme: "el temario", definition: "programme à réviser", type: "" },
  { terme: "el apunte", definition: "note prise en cours", type: "" },
  { terme: "el subrayado", definition: "surlignage", type: "" },
  { terme: "el esquema", definition: "plan structuré", type: "" },
  { terme: "el resumen", definition: "résumé", type: "" },
  { terme: "la redacción", definition: "rédaction", type: "" },
  { terme: "la falta", definition: "absence en cours", type: "" },
  { terme: "el justificante", definition: "justificatif d'absence", type: "" },
  { terme: "el diccionario", definition: "dictionnaire", type: "" },
  { terme: "la gramática", definition: "grammaire", type: "" },
  { terme: "el vocabulario", definition: "vocabulaire", type: "" },
  { terme: "la traducción", definition: "traduction", type: "" },
  { terme: "el idioma", definition: "langue (nom masculin)", type: "" },
  { terme: "bilingüe", definition: "bilingue", type: "" },
  { terme: "el intercambio", definition: "échange scolaire", type: "" },
  { terme: "la residencia", definition: "résidence universitaire", type: "" },
  { terme: "el campus", definition: "campus", type: "" },
  { terme: "la facultad", definition: "faculté universitaire", type: "" },
  { terme: "el grado", definition: "diplôme de licence", type: "" },
  { terme: "el máster", definition: "master", type: "" },
  { terme: "la tesis", definition: "mémoire ou thèse", type: "" },
  { terme: "el tutor", definition: "tuteur", type: "" },
  { terme: "la calificación", definition: "note attribuée", type: "" },
  { terme: "el boletín de notas", definition: "bulletin scolaire", type: "" },
  { terme: "la asistencia", definition: "présence en cours", type: "" },
  { terme: "el curso", definition: "année scolaire", type: "" },
  { terme: "el grupo de clase", definition: "groupe-classe", type: "" },
  { terme: "la optativa", definition: "matière au choix", type: "" },
  { terme: "el laboratorio de idiomas", definition: "laboratoire de langues", type: "" },
  { terme: "la calculadora", definition: "calculatrice", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "aprobar", definition: "réussir un examen, et non « approuver »", type: "" },
  { terme: "suspender", definition: "échouer à un examen, et non « suspendre »", type: "" },
  { terme: "recordar", definition: "se souvenir, et non « enregistrer »", type: "" },
  { terme: "contestar", definition: "répondre, et non « contester »", type: "" },
  { terme: "repasar", definition: "réviser", type: "" },
  { terme: "memorizar", definition: "mémoriser", type: "" },
  { terme: "apuntarse", definition: "s'inscrire à une activité", type: "" },
  { terme: "entregar un trabajo", definition: "rendre un devoir", type: "" },
  { terme: "faltar a clase", definition: "manquer un cours", type: "" },
  { terme: "sacar una nota", definition: "obtenir une note", type: "" },
  { terme: "copiar", definition: "tricher en copiant", type: "" },
  { terme: "preguntar", definition: "poser une question", type: "" },
  { terme: "explicar", definition: "expliquer", type: "" },
  { terme: "matricularse", definition: "s'inscrire dans un établissement", type: "" },
  { terme: "empollar", definition: "bachoter", type: "" },
  // —— 20 expressions ——
  { terme: "quemarse las pestañas", definition: "veiller tard sur ses cahiers", type: "expression" },
  { terme: "conocer al dedillo", definition: "connaître sur le bout des doigts", type: "expression" },
  { terme: "estar pez", definition: "n'y rien connaître", type: "expression" },
  { terme: "ser un hacha", definition: "être très fort dans un domaine", type: "expression" },
  { terme: "hacer novillos", definition: "sécher les cours", type: "expression" },
  { terme: "cantar las cuarenta", definition: "dire ses quatre vérités", type: "expression" },
  { terme: "volver a las andadas", definition: "retomber dans les mêmes travers", type: "expression" },
  { terme: "empezar la casa por el tejado", definition: "mettre la charrue avant les bœufs", type: "expression" },
  { terme: "de pe a pa", definition: "de A à Z", type: "expression" },
  { terme: "no dar pie con bola", definition: "n'arriver à rien", type: "expression" },
  { terme: "quedarse en blanco", definition: "avoir un blanc", type: "expression" },
  { terme: "tener la cabeza como un colador", definition: "avoir une mémoire de passoire", type: "expression" },
  { terme: "comulgar con ruedas de molino", definition: "gober n'importe quoi", type: "expression" },
  { terme: "estar más perdido que un pulpo en un garaje", definition: "être complètement perdu", type: "expression" },
  { terme: "ser el último mono", definition: "ne compter pour rien", type: "expression" },
  { terme: "tener más cara que espalda", definition: "avoir un culot monstre", type: "expression" },
  { terme: "salvar los muebles", definition: "sauver l'essentiel d'un échec", type: "expression" },
  { terme: "aprobar por los pelos", definition: "réussir de justesse", type: "expression" },
  { terme: "dar en el clavo", definition: "viser juste", type: "expression" },
  { terme: "estar en Babia", definition: "avoir la tête ailleurs", type: "expression" },
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
