/**
 * Pack 3 — Travail & carrière (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el puesto", definition: "poste", type: "" },
  { terme: "el jefe", definition: "patron, patronne", type: "" },
  { terme: "el salario por hora", definition: "salaire horaire", type: "" },
  { terme: "el sueldo", definition: "salaire mensuel", type: "" },
  { terme: "la contratación", definition: "embauche", type: "" },
  { terme: "el despido", definition: "licenciement", type: "" },
  { terme: "la dimisión", definition: "démission", type: "" },
  { terme: "la oficina", definition: "bureau (pièce)", type: "" },
  { terme: "el turno", definition: "tranche horaire de travail", type: "" },
  { terme: "el equipo", definition: "équipe de travail", type: "" },
  { terme: "la tarea", definition: "tâche", type: "" },
  { terme: "la competencia profesional", definition: "compétence professionnelle", type: "" },
  { terme: "la carrera profesional", definition: "carrière", type: "" },
  { terme: "el becario", definition: "stagiaire intégré à une équipe", type: "" },
  { terme: "el aprendiz", definition: "apprenti", type: "" },
  { terme: "el superior jerárquico", definition: "supérieur hiérarchique", type: "" },
  { terme: "la plantilla", definition: "personnel d'une entreprise", type: "" },
  { terme: "el compañero de trabajo", definition: "collègue", type: "" },
  { terme: "la reunión", definition: "réunion de travail", type: "" },
  { terme: "la fecha límite", definition: "date limite de remise", type: "" },
  { terme: "la paga extra", definition: "mois de salaire supplémentaire versé en juin et en décembre", type: "" },
  { terme: "la jubilación", definition: "retraite", type: "" },
  { terme: "la oferta de empleo", definition: "offre d'emploi", type: "" },
  { terme: "el ascenso", definition: "promotion", type: "" },
  { terme: "el contrato de trabajo", definition: "contrat de travail", type: "" },
  { terme: "la nómina", definition: "bulletin de paie", type: "" },
  { terme: "el empleador", definition: "employeur", type: "" },
  { terme: "el asalariado", definition: "salarié", type: "" },
  { terme: "la hora extra", definition: "heure supplémentaire", type: "" },
  { terme: "el trayecto al trabajo", definition: "trajet domicile-travail", type: "" },
  { terme: "la entrevista de trabajo", definition: "entretien d'embauche", type: "" },
  { terme: "el candidato", definition: "candidat à un poste", type: "" },
  { terme: "el finiquito", definition: "solde de tout compte", type: "" },
  { terme: "la supresión de puestos", definition: "suppression de postes", type: "" },
  { terme: "el trabajo por cuenta propia", definition: "activité indépendante", type: "" },
  { terme: "el lugar de trabajo", definition: "lieu de travail", type: "" },
  { terme: "la red de contactos", definition: "réseau de contacts professionnels", type: "" },
  { terme: "el agotamiento profesional", definition: "épuisement lié au travail", type: "" },
  { terme: "la carga de trabajo", definition: "charge de travail", type: "" },
  { terme: "el período de prueba", definition: "période d'essai", type: "" },
  { terme: "la indemnización por despido", definition: "indemnité de licenciement", type: "" },
  { terme: "la baja médica", definition: "arrêt maladie", type: "" },
  { terme: "las vacaciones", definition: "congés", type: "" },
  { terme: "el salario mínimo", definition: "salaire minimum", type: "" },
  { terme: "el sindicato", definition: "syndicat", type: "" },
  { terme: "el techo de cristal", definition: "plafond de verre", type: "" },
  { terme: "la protección frente al despido", definition: "protection contre le licenciement", type: "" },
  { terme: "el teletrabajo", definition: "télétravail", type: "" },
  { terme: "el horario flexible", definition: "horaires flexibles", type: "" },
  { terme: "el mercado laboral", definition: "marché de l'emploi", type: "" },
  { terme: "la conciliación laboral", definition: "équilibre entre le métier et la vie personnelle", type: "" },
  { terme: "la igualdad salarial", definition: "égalité de rémunération", type: "" },
  { terme: "la incorporación", definition: "prise de poste", type: "" },
  { terme: "el cazatalentos", definition: "recruteur externe", type: "" },
  { terme: "el éxito", definition: "succès, et non « sortie »", type: "" },
  { terme: "el empleado", definition: "employé", type: "" },
  { terme: "el tiempo parcial", definition: "temps partiel", type: "" },
  { terme: "el tiempo completo", definition: "temps plein", type: "" },
  { terme: "el currículum", definition: "curriculum vitæ", type: "" },
  { terme: "la carta de motivación", definition: "lettre de motivation", type: "" },
  { terme: "la carta de recomendación", definition: "lettre de recommandation", type: "" },
  { terme: "la evaluación anual", definition: "entretien annuel d'évaluation", type: "" },
  { terme: "las prácticas de empresa", definition: "stage en entreprise", type: "" },
  { terme: "la huelga", definition: "grève", type: "" },
  { terme: "el escritorio", definition: "bureau (meuble)", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "fichar al entrar", definition: "pointer à l'arrivée", type: "" },
  { terme: "fichar al salir", definition: "pointer au départ", type: "" },
  { terme: "entregar", definition: "remettre un document", type: "" },
  { terme: "asumir", definition: "accepter une responsabilité", type: "" },
  { terme: "dispensar", definition: "dispenser quelqu'un d'une obligation", type: "" },
  { terme: "incorporarse", definition: "prendre ses fonctions", type: "" },
  { terme: "hacer un seguimiento", definition: "relancer après un premier contact", type: "" },
  { terme: "ascender", definition: "monter en grade", type: "" },
  { terme: "echar una mano", definition: "donner un coup de main", type: "" },
  { terme: "cancelar", definition: "annuler un rendez-vous", type: "" },
  { terme: "rellenar", definition: "compléter un formulaire", type: "" },
  { terme: "realizar", definition: "accomplir, et non « se rendre compte »", type: "" },
  { terme: "inscribir", definition: "inscrire auprès d'un organisme", type: "" },
  { terme: "recuperar el retraso", definition: "rattraper un retard", type: "" },
  { terme: "presentar una candidatura", definition: "déposer sa candidature", type: "" },
  // —— 20 expressions ——
  { terme: "poner de patitas en la calle", definition: "mettre quelqu'un à la porte de son emploi", type: "expression" },
  { terme: "pillarle el truco", definition: "avoir le coup de main", type: "expression" },
  { terme: "dar la jornada por terminada", definition: "arrêter le travail pour la journée", type: "expression" },
  { terme: "pasar la noche en vela", definition: "rester éveillé jusqu'au matin", type: "expression" },
  { terme: "estar a la altura", definition: "être à la hauteur de la situation", type: "expression" },
  { terme: "ir al grano", definition: "en venir au fait", type: "expression" },
  { terme: "mirar con otros ojos", definition: "regarder une situation autrement", type: "expression" },
  { terme: "estar al loro", definition: "être vif et attentif", type: "expression" },
  { terme: "entre bastidores", definition: "dans les coulisses", type: "expression" },
  { terme: "quedarse al pie del cañón", definition: "tenir le poste sans fléchir", type: "expression" },
  { terme: "abandonar el barco", definition: "quitter une affaire déjà perdue", type: "expression" },
  { terme: "tener varios frentes abiertos", definition: "mener plusieurs choses à la fois", type: "expression" },
  { terme: "alborotar el gallinero", definition: "provoquer des remous", type: "expression" },
  { terme: "no perder de vista el conjunto", definition: "garder la vue d'ensemble", type: "expression" },
  { terme: "estar en juego", definition: "être en jeu", type: "expression" },
  { terme: "empezar de cero", definition: "repartir de zéro", type: "expression" },
  { terme: "mantener un perfil bajo", definition: "rester discret", type: "expression" },
  { terme: "escalar puestos", definition: "gravir les échelons", type: "expression" },
  { terme: "tener enchufe", definition: "obtenir un avantage grâce à ses relations", type: "expression" },
  { terme: "trabajo a reglamento", definition: "s'en tenir au strict minimum du règlement", type: "expression" },
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
