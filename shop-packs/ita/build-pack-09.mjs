/**
 * Pack 9 — Technologie & sciences (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "il computer", definition: "ordinateur", type: "" },
  { terme: "lo smartphone", definition: "téléphone connecté", type: "" },
  { terme: "il computer portatile", definition: "ordinateur portable", type: "" },
  { terme: "lo schermo", definition: "écran", type: "" },
  { terme: "la tastiera", definition: "clavier", type: "" },
  { terme: "il mouse", definition: "souris d'ordinateur", type: "" },
  { terme: "il file", definition: "fichier", type: "" },
  { terme: "la cartella", definition: "dossier sur un ordinateur", type: "" },
  { terme: "la rete", definition: "réseau internet", type: "" },
  { terme: "il wi-fi", definition: "connexion sans fil", type: "" },
  { terme: "l'applicazione (f.)", definition: "application", type: "" },
  { terme: "il software", definition: "logiciel", type: "" },
  { terme: "l'hardware (m.)", definition: "matériel informatique", type: "" },
  { terme: "il programma", definition: "programme informatique", type: "" },
  { terme: "il codice sorgente", definition: "code source", type: "" },
  { terme: "il linguaggio di programmazione", definition: "langage de programmation", type: "" },
  { terme: "il bug", definition: "défaut dans un programme", type: "" },
  { terme: "l'aggiornamento (m.)", definition: "mise à jour", type: "" },
  { terme: "la batteria", definition: "batterie", type: "" },
  { terme: "il caricabatterie", definition: "chargeur", type: "" },
  { terme: "la stampante", definition: "imprimante", type: "" },
  { terme: "l'intelligenza artificiale (f.)", definition: "intelligence artificielle", type: "" },
  { terme: "il robot", definition: "robot", type: "" },
  { terme: "il satellite", definition: "satellite", type: "" },
  { terme: "l'esperimento (m.)", definition: "expérience scientifique", type: "" },
  { terme: "l'ipotesi (f.)", definition: "hypothèse", type: "" },
  { terme: "la teoria", definition: "théorie", type: "" },
  { terme: "il microscopio", definition: "microscope", type: "" },
  { terme: "la provetta", definition: "éprouvette", type: "" },
  { terme: "il ricercatore", definition: "chercheur", type: "" },
  { terme: "la scoperta", definition: "découverte", type: "" },
  { terme: "l'invenzione (f.)", definition: "invention", type: "" },
  { terme: "il dato", definition: "donnée", type: "" },
  { terme: "la statistica", definition: "statistique", type: "" },
  { terme: "il grafico", definition: "graphique", type: "" },
  { terme: "la chimica", definition: "chimie", type: "" },
  { terme: "la fisica", definition: "physique", type: "" },
  { terme: "la biologia", definition: "biologie", type: "" },
  { terme: "l'atomo (m.)", definition: "atome", type: "" },
  { terme: "la molecola", definition: "molécule", type: "" },
  { terme: "la gravità", definition: "gravité", type: "" },
  { terme: "la cellula", definition: "cellule", type: "" },
  { terme: "il DNA", definition: "ADN", type: "" },
  { terme: "il gene", definition: "gène", type: "" },
  { terme: "l'evoluzione (f.)", definition: "évolution des espèces", type: "" },
  { terme: "il laboratorio di ricerca", definition: "laboratoire de recherche", type: "" },
  { terme: "la ricerca scientifica", definition: "recherche scientifique", type: "" },
  { terme: "il metodo scientifico", definition: "méthode scientifique", type: "" },
  { terme: "la variabile", definition: "variable", type: "" },
  { terme: "il campione di laboratorio", definition: "échantillon", type: "" },
  { terme: "la revisione tra pari", definition: "évaluation d'un travail par d'autres chercheurs", type: "" },
  { terme: "la pubblicazione scientifica", definition: "article de recherche", type: "" },
  { terme: "il brevetto", definition: "brevet", type: "" },
  { terme: "l'innovazione (f.)", definition: "innovation", type: "" },
  { terme: "la realtà virtuale", definition: "réalité virtuelle", type: "" },
  { terme: "il cloud", definition: "stockage de données en ligne", type: "" },
  { terme: "l'autenticazione (f.)", definition: "vérification de l'identité", type: "" },
  { terme: "il virus informatico", definition: "virus informatique", type: "" },
  { terme: "l'antivirus (m.)", definition: "logiciel qui bloque les virus", type: "" },
  { terme: "la copia di sicurezza", definition: "sauvegarde", type: "" },
  { terme: "il link", definition: "lien hypertexte", type: "" },
  { terme: "il browser", definition: "logiciel pour naviguer sur le web", type: "" },
  { terme: "il server", definition: "serveur informatique", type: "" },
  { terme: "il sensore", definition: "capteur", type: "" },
  { terme: "il telescopio", definition: "télescope", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "scaricare", definition: "télécharger", type: "" },
  { terme: "caricare un file", definition: "envoyer un fichier vers un serveur", type: "" },
  { terme: "salvare", definition: "enregistrer un fichier", type: "" },
  { terme: "cancellare un file", definition: "effacer un fichier", type: "" },
  { terme: "accendere il computer", definition: "allumer un ordinateur", type: "" },
  { terme: "spegnere il computer", definition: "éteindre un ordinateur", type: "" },
  { terme: "collegarsi", definition: "se connecter", type: "" },
  { terme: "disconnettersi", definition: "se déconnecter", type: "" },
  { terme: "aggiornare il software", definition: "mettre à jour un logiciel", type: "" },
  { terme: "installare", definition: "installer un programme", type: "" },
  { terme: "programmare", definition: "programmer", type: "" },
  { terme: "copiare e incollare", definition: "copier-coller", type: "" },
  { terme: "stampare", definition: "imprimer", type: "" },
  { terme: "verificare un'ipotesi", definition: "tester une hypothèse", type: "" },
  { terme: "misurare", definition: "mesurer", type: "" },
  // —— 20 expressions ——
  { terme: "scoprire l'acqua calda", definition: "présenter comme neuf ce que tout le monde sait", type: "expression" },
  { terme: "reinventare la ruota", definition: "refaire un travail déjà résolu", type: "expression" },
  { terme: "andare in tilt", definition: "se bloquer net", type: "expression" },
  { terme: "essere anni luce avanti", definition: "avoir une très grande avance", type: "expression" },
  { terme: "avere la scienza infusa", definition: "prétendre savoir sans avoir appris", type: "expression" },
  { terme: "il diavolo sta nei dettagli", definition: "l'erreur se cache dans un petit détail", type: "expression" },
  { terme: "i conti non tornano", definition: "les données ne concordent pas", type: "expression" },
  { terme: "fare luce su", definition: "éclaircir une question obscure", type: "expression" },
  { terme: "di punto in bianco", definition: "sans signe avant-coureur", type: "expression" },
  { terme: "due più due fa quattro", definition: "être d'une évidence totale", type: "expression" },
  { terme: "dare i numeri", definition: "dire des choses sans queue ni tête", type: "expression" },
  { terme: "provare sulla propria pelle", definition: "le vérifier par sa propre expérience", type: "expression" },
  { terme: "staccare la spina", definition: "débrancher un appareil, ou bien stopper une activité", type: "expression" },
  { terme: "essere fermo all'età della pietra", definition: "accuser un retard technique énorme", type: "expression" },
  { terme: "non fare una piega", definition: "se passer impeccablement, sans rien à redire", type: "expression" },
  { terme: "brancolare nel buio", definition: "avancer sans aucun repère", type: "expression" },
  { terme: "mettere il carro davanti ai buoi", definition: "commencer par la fin", type: "expression" },
  { terme: "fare tabula rasa", definition: "tout effacer pour recommencer", type: "expression" },
  { terme: "un fulmine a ciel sereno", definition: "un événement brusque et imprévu", type: "expression" },
  { terme: "tenere il passo", definition: "rester au niveau des autres", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-09-technologie-sciences.xlsx"));
