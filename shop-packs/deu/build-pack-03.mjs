/**
 * Pack 3 — Travail & carrière (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Stelle", definition: "poste", type: "" },
  { terme: "der Chef", definition: "patron", type: "" },
  { terme: "der Stundenlohn", definition: "salaire horaire", type: "" },
  { terme: "das Gehalt", definition: "salaire mensuel", type: "" },
  { terme: "die Neueinstellung", definition: "embauche", type: "" },
  { terme: "die Entlassung", definition: "licenciement", type: "" },
  { terme: "kündigen", definition: "résilier un contrat de travail (démission ou licenciement selon qui agit)", type: "" },
  { terme: "das Büro", definition: "bureau (pièce)", type: "" },
  { terme: "die Schicht", definition: "tranche horaire de travail", type: "" },
  { terme: "das Team", definition: "équipe de travail", type: "" },
  { terme: "die Aufgabe", definition: "tâche", type: "" },
  { terme: "die Kompetenz", definition: "compétence professionnelle", type: "" },
  { terme: "die Karriere", definition: "carrière", type: "" },
  { terme: "der Praktikant", definition: "stagiaire", type: "" },
  { terme: "der Auszubildende", definition: "apprenti en alternance", type: "" },
  { terme: "der Vorgesetzte", definition: "supérieur hiérarchique", type: "" },
  { terme: "die Belegschaft", definition: "personnel d'une entreprise", type: "" },
  { terme: "der Kollege", definition: "collègue", type: "" },
  { terme: "die Besprechung", definition: "réunion de travail", type: "" },
  { terme: "die Abgabefrist", definition: "date limite de remise", type: "" },
  { terme: "die Prämie", definition: "prime", type: "" },
  { terme: "die Rente", definition: "retraite", type: "" },
  { terme: "die Stellenanzeige", definition: "offre d'emploi", type: "" },
  { terme: "die Beförderung", definition: "promotion", type: "" },
  { terme: "der Arbeitsvertrag", definition: "contrat de travail", type: "" },
  { terme: "die Lohnabrechnung", definition: "bulletin de paie", type: "" },
  { terme: "der Arbeitgeber", definition: "employeur", type: "" },
  { terme: "der Arbeitnehmer", definition: "salarié", type: "" },
  { terme: "die Überstunde", definition: "heure supplémentaire", type: "" },
  { terme: "der Arbeitsweg", definition: "trajet domicile-travail", type: "" },
  { terme: "das Vorstellungsgespräch", definition: "entretien d'embauche", type: "" },
  { terme: "der Bewerber", definition: "candidat à un poste", type: "" },
  { terme: "die Kündigung", definition: "lettre de rupture du contrat", type: "" },
  { terme: "der Stellenabbau", definition: "suppression de postes", type: "" },
  { terme: "die Selbstständigkeit", definition: "activité indépendante", type: "" },
  { terme: "der Arbeitsplatz", definition: "lieu de travail", type: "" },
  { terme: "die Kontaktpflege", definition: "entretien de son réseau professionnel", type: "" },
  { terme: "das Burn-out", definition: "épuisement professionnel", type: "" },
  { terme: "die Arbeitsbelastung", definition: "charge de travail", type: "" },
  { terme: "die Probezeit", definition: "période d'essai", type: "" },
  { terme: "die Abfindung", definition: "indemnité de départ", type: "" },
  { terme: "die Krankmeldung", definition: "déclaration d'arrêt maladie", type: "" },
  { terme: "der Urlaub", definition: "congés", type: "" },
  { terme: "der Mindestlohn", definition: "salaire minimum", type: "" },
  { terme: "die Gewerkschaft", definition: "syndicat", type: "" },
  { terme: "die gläserne Decke", definition: "plafond de verre", type: "" },
  { terme: "der Kündigungsschutz", definition: "protection contre le licenciement", type: "" },
  { terme: "das Homeoffice", definition: "télétravail", type: "" },
  { terme: "die Gleitzeit", definition: "horaires flexibles", type: "" },
  { terme: "der Arbeitsmarkt", definition: "marché de l'emploi", type: "" },
  { terme: "die Vereinbarkeit", definition: "conciliation entre métier et vie personnelle", type: "" },
  { terme: "die Entgeltgleichheit", definition: "égalité de rémunération", type: "" },
  { terme: "die Einarbeitung", definition: "prise en main d'un nouveau poste", type: "" },
  { terme: "der Personalberater", definition: "recruteur externe", type: "" },
  { terme: "die Fachkraft", definition: "professionnel qualifié", type: "" },
  { terme: "der Angestellte", definition: "employé", type: "" },
  { terme: "die Teilzeit", definition: "temps partiel", type: "" },
  { terme: "die Vollzeit", definition: "temps plein", type: "" },
  { terme: "der Lebenslauf", definition: "curriculum vitæ", type: "" },
  { terme: "das Anschreiben", definition: "lettre de motivation", type: "" },
  { terme: "das Arbeitszeugnis", definition: "certificat de travail", type: "" },
  { terme: "das Mitarbeitergespräch", definition: "entretien annuel d'évaluation", type: "" },
  { terme: "das Praktikum", definition: "stage", type: "" },
  { terme: "der Streik", definition: "grève", type: "" },
  { terme: "der Schreibtisch", definition: "bureau (meuble)", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "einstempeln", definition: "pointer à l'arrivée", type: "" },
  { terme: "ausstempeln", definition: "pointer au départ", type: "" },
  { terme: "abgeben", definition: "remettre un document", type: "" },
  { terme: "annehmen", definition: "accepter une responsabilité", type: "" },
  { terme: "freistellen", definition: "dispenser un salarié de venir", type: "" },
  { terme: "antreten", definition: "prendre ses fonctions", type: "" },
  { terme: "nachfassen", definition: "relancer un interlocuteur", type: "" },
  { terme: "aufsteigen", definition: "monter en grade", type: "" },
  { terme: "aushelfen", definition: "dépanner un collègue", type: "" },
  { terme: "absagen", definition: "annuler un rendez-vous", type: "" },
  { terme: "ausfüllen", definition: "compléter un formulaire", type: "" },
  { terme: "nachgehen", definition: "creuser une question", type: "" },
  { terme: "anmelden", definition: "inscrire auprès d'un organisme", type: "" },
  { terme: "aufholen", definition: "rattraper un retard", type: "" },
  { terme: "einreichen", definition: "déposer un dossier", type: "" },
  // —— 20 expressions ——
  { terme: "den Stuhl vor die Tür gesetzt bekommen", definition: "être mis à la porte de son emploi", type: "expression" },
  { terme: "den Dreh heraushaben", definition: "avoir le coup de main", type: "expression" },
  { terme: "Feierabend machen", definition: "arrêter le travail pour la journée", type: "expression" },
  { terme: "die Nacht zum Tag machen", definition: "travailler jusqu'au matin", type: "expression" },
  { terme: "der Situation gewachsen sein", definition: "être à la hauteur de la situation", type: "expression" },
  { terme: "zur Sache kommen", definition: "en venir au fait", type: "expression" },
  { terme: "um die Ecke denken", definition: "chercher une idée hors des habitudes", type: "expression" },
  { terme: "auf Zack sein", definition: "être vif et efficace", type: "expression" },
  { terme: "hinter den Kulissen", definition: "dans les coulisses", type: "expression" },
  { terme: "die Stellung halten", definition: "assurer la continuité en l'absence des autres", type: "expression" },
  { terme: "das sinkende Schiff verlassen", definition: "quitter une affaire déjà perdue", type: "expression" },
  { terme: "mehrere Eisen im Feuer haben", definition: "mener plusieurs projets à la fois", type: "expression" },
  { terme: "die Pferde scheu machen", definition: "provoquer des remous", type: "expression" },
  { terme: "das große Ganze sehen", definition: "garder la vue d'ensemble", type: "expression" },
  { terme: "auf dem Spiel stehen", definition: "être en jeu", type: "expression" },
  { terme: "bei null anfangen", definition: "repartir de zéro", type: "expression" },
  { terme: "den Ball flach halten", definition: "rester discret", type: "expression" },
  { terme: "die Karriereleiter hinaufklettern", definition: "gravir les échelons", type: "expression" },
  { terme: "seine Beziehungen spielen lassen", definition: "obtenir un avantage grâce à ses contacts", type: "expression" },
  { terme: "Dienst nach Vorschrift machen", definition: "s'en tenir au strict minimum du règlement", type: "expression" },
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
