/**
 * Pack 3 — Travail & carrière (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "job", definition: "emploi", type: "" },
  { terme: "boss", definition: "patron", type: "" },
  { terme: "wage", definition: "salaire horaire", type: "" },
  { terme: "salary", definition: "salaire", type: "" },
  { terme: "hire", definition: "embaucher", type: "" },
  { terme: "fire", definition: "licencier", type: "" },
  { terme: "quit", definition: "démissionner", type: "" },
  { terme: "office", definition: "bureau", type: "" },
  { terme: "shift", definition: "équipe / poste", type: "" },
  { terme: "team", definition: "équipe", type: "" },
  { terme: "task", definition: "tâche", type: "" },
  { terme: "skill", definition: "compétence", type: "" },
  { terme: "career", definition: "carrière", type: "" },
  { terme: "intern", definition: "stagiaire", type: "" },
  { terme: "trainee", definition: "stagiaire en formation", type: "" },
  { terme: "manager", definition: "responsable", type: "" },
  { terme: "staff", definition: "personnel", type: "" },
  { terme: "colleague", definition: "collègue", type: "" },
  { terme: "meeting", definition: "réunion", type: "" },
  { terme: "deadline", definition: "date limite", type: "" },
  { terme: "bonus", definition: "prime", type: "" },
  { terme: "pension", definition: "retraite", type: "" },
  { terme: "vacancy", definition: "poste vacant", type: "" },
  { terme: "promotion", definition: "promotion", type: "" },
  { terme: "contract", definition: "contrat", type: "" },
  { terme: "payroll", definition: "paie", type: "" },
  { terme: "employer", definition: "employeur", type: "" },
  { terme: "employee", definition: "salarié", type: "" },
  { terme: "overtime", definition: "heures supplémentaires", type: "" },
  { terme: "commute", definition: "trajet domicile-travail", type: "" },
  { terme: "interview", definition: "entretien", type: "" },
  { terme: "applicant", definition: "candidat", type: "" },
  { terme: "resignation", definition: "démission", type: "" },
  { terme: "layoff", definition: "licenciement économique", type: "" },
  { terme: "freelance", definition: "indépendant", type: "" },
  { terme: "workplace", definition: "lieu de travail", type: "" },
  { terme: "networking", definition: "réseautage professionnel", type: "" },
  { terme: "burnout", definition: "épuisement professionnel", type: "" },
  { terme: "workload", definition: "charge de travail", type: "" },
  { terme: "probation", definition: "période d'essai", type: "" },
  { terme: "severance pay", definition: "indemnité de départ", type: "" },
  { terme: "sick leave", definition: "congé maladie", type: "" },
  { terme: "annual leave", definition: "congés payés", type: "" },
  { terme: "minimum wage", definition: "salaire minimum", type: "" },
  { terme: "trade union", definition: "syndicat", type: "" },
  { terme: "glass ceiling", definition: "plafond de verre", type: "" },
  { terme: "job security", definition: "sécurité de l'emploi", type: "" },
  { terme: "remote work", definition: "télétravail", type: "" },
  { terme: "hybrid schedule", definition: "emploi du temps hybride", type: "" },
  { terme: "job market", definition: "marché de l'emploi", type: "" },
  { terme: "work-life balance", definition: "équilibre vie pro–vie perso", type: "" },
  { terme: "equal pay", definition: "égalité salariale", type: "" },
  { terme: "onboarding", definition: "intégration des nouveaux", type: "" },
  { terme: "headhunter", definition: "chasseur de têtes", type: "" },
  { terme: "blue-collar", definition: "ouvrier", type: "" },
  { terme: "white-collar", definition: "employé de bureau", type: "" },
  { terme: "part-time", definition: "temps partiel", type: "" },
  { terme: "full-time", definition: "temps plein", type: "" },
  { terme: "CV", definition: "curriculum vitæ", type: "" },
  { terme: "cover letter", definition: "lettre de motivation", type: "" },
  { terme: "reference letter", definition: "lettre de recommandation", type: "" },
  { terme: "performance review", definition: "évaluation annuelle", type: "" },
  { terme: "unpaid internship", definition: "stage non rémunéré", type: "" },
  { terme: "strike", definition: "grève", type: "" },
  { terme: "desk", definition: "bureau (meuble)", type: "" },
  { terme: "clock in", definition: "pointer à l'arrivée", type: "" },
  { terme: "clock out", definition: "pointer au départ", type: "" },
  { terme: "hand in", definition: "remettre", type: "" },
  { terme: "take on", definition: "accepter (une charge)", type: "" },
  { terme: "lay off", definition: "licencier", type: "" },
  { terme: "show up", definition: "se présenter", type: "" },
  { terme: "follow up", definition: "faire un suivi", type: "" },
  { terme: "move up", definition: "gravir les échelons", type: "" },
  { terme: "stay late", definition: "rester tard", type: "" },
  { terme: "call off", definition: "annuler", type: "" },
  { terme: "fill in", definition: "remplir (un formulaire)", type: "" },
  { terme: "look into", definition: "examiner", type: "" },
  { terme: "sign up", definition: "s'inscrire", type: "" },
  { terme: "brush up on", definition: "se remettre à niveau", type: "" },
  { terme: "apply for", definition: "postuler pour", type: "" },
  { terme: "get the sack", definition: "se faire virer", type: "expression" },
  { terme: "learn the ropes", definition: "apprendre le métier", type: "expression" },
  { terme: "call it a day", definition: "s'arrêter pour aujourd'hui", type: "expression" },
  { terme: "burn the midnight oil", definition: "travailler tard dans la nuit", type: "expression" },
  { terme: "rise to the occasion", definition: "être à la hauteur", type: "expression" },
  { terme: "get down to business", definition: "passer aux choses sérieuses", type: "expression" },
  { terme: "think outside the box", definition: "sortir des sentiers battus", type: "expression" },
  { terme: "on the ball", definition: "être réactif et efficace", type: "expression" },
  { terme: "behind the scenes", definition: "coulisses", type: "expression" },
  { terme: "hold the fort", definition: "tenir le coup en l'absence des autres", type: "expression" },
  { terme: "jump ship", definition: "quitter une organisation", type: "expression" },
  { terme: "wear many hats", definition: "cumuler plusieurs rôles", type: "expression" },
  { terme: "rock the boat", definition: "provoquer des remous", type: "expression" },
  { terme: "big picture", definition: "vue d'ensemble", type: "expression" },
  { terme: "at stake", definition: "en jeu", type: "expression" },
  { terme: "from scratch", definition: "à partir de zéro", type: "expression" },
  { terme: "keep your head down", definition: "ne pas attirer l'attention", type: "expression" },
  { terme: "climb the career ladder", definition: "gravir les échelons", type: "expression" },
  { terme: "pull strings", definition: "tirer des ficelles", type: "expression" },
  { terme: "nine-to-five", definition: "horaires de bureau classiques", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-03-travail-carriere.xlsx"));