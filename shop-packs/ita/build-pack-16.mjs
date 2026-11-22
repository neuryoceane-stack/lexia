/**
 * Pack 16 — Ville & orientation (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la città", definition: "ville", type: "" },
  { terme: "il paese", definition: "village, ou le pays ; le contexte tranche", type: "" },
  { terme: "la strada", definition: "rue ou route", type: "" },
  { terme: "la via", definition: "rue, dans une adresse", type: "" },
  { terme: "la piazza", definition: "place publique", type: "" },
  { terme: "il vicolo", definition: "ruelle", type: "" },
  { terme: "l'incrocio (m.)", definition: "carrefour", type: "" },
  { terme: "il semaforo", definition: "feu de signalisation", type: "" },
  { terme: "il marciapiede", definition: "trottoir", type: "" },
  { terme: "l'angolo (m.)", definition: "coin de rue", type: "" },
  { terme: "a destra", definition: "à droite", type: "" },
  { terme: "a sinistra", definition: "à gauche", type: "" },
  { terme: "dritto", definition: "tout droit", type: "" },
  { terme: "di fronte", definition: "en face", type: "" },
  { terme: "il centro storico", definition: "centre ancien", type: "" },
  { terme: "la periferia", definition: "périphérie", type: "" },
  { terme: "il quartiere", definition: "quartier", type: "" },
  { terme: "l'indirizzo (m.)", definition: "adresse", type: "" },
  { terme: "il numero civico", definition: "numéro dans la rue", type: "" },
  { terme: "il portone", definition: "porte cochère d'un immeuble", type: "" },
  { terme: "la mappa", definition: "plan d'une ville", type: "" },
  { terme: "la bussola", definition: "boussole", type: "" },
  { terme: "l'autobus (m.)", definition: "bus", type: "" },
  { terme: "il tram", definition: "tramway", type: "" },
  { terme: "la metropolitana", definition: "métro", type: "" },
  { terme: "la fermata", definition: "arrêt de bus ou de tram", type: "" },
  { terme: "il capolinea", definition: "terminus", type: "" },
  { terme: "l'abbonamento (m.)", definition: "abonnement de transport", type: "" },
  { terme: "la pensilina", definition: "abribus", type: "" },
  { terme: "il senso di marcia", definition: "sens de circulation", type: "" },
  { terme: "la rotonda", definition: "rond-point", type: "" },
  { terme: "il sottopassaggio", definition: "passage souterrain", type: "" },
  { terme: "la galleria", definition: "tunnel routier", type: "" },
  { terme: "il ponte", definition: "pont", type: "" },
  { terme: "la tangenziale", definition: "rocade urbaine", type: "" },
  { terme: "il parcheggio", definition: "parking", type: "" },
  { terme: "il divieto di sosta", definition: "stationnement interdit", type: "" },
  { terme: "il vigile", definition: "agent de la police municipale", type: "" },
  { terme: "il pedone", definition: "piéton", type: "" },
  { terme: "l'attraversamento pedonale (m.)", definition: "passage piéton", type: "" },
  { terme: "il municipio", definition: "hôtel de ville, le bâtiment", type: "" },
  { terme: "la fontana", definition: "fontaine", type: "" },
  { terme: "il duomo", definition: "cathédrale, dans de nombreuses villes italiennes", type: "" },
  { terme: "il campanile", definition: "clocher", type: "" },
  { terme: "la vetrina", definition: "vitrine", type: "" },
  { terme: "l'insegna (f.)", definition: "enseigne d'un commerce", type: "" },
  { terme: "il cartello", definition: "panneau", type: "" },
  { terme: "la segnaletica", definition: "signalisation", type: "" },
  { terme: "il centro commerciale", definition: "centre commercial", type: "" },
  { terme: "la stazione", definition: "gare", type: "" },
  { terme: "l'aeroporto (m.)", definition: "aéroport", type: "" },
  { terme: "il traffico", definition: "circulation des véhicules", type: "" },
  { terme: "il clacson", definition: "klaxon", type: "" },
  { terme: "la bicicletta", definition: "vélo", type: "" },
  { terme: "il motorino", definition: "scooter", type: "" },
  { terme: "il casco", definition: "casque", type: "" },
  { terme: "la corsia", definition: "voie de circulation", type: "" },
  { terme: "l'isolato (m.)", definition: "pâté de maisons", type: "" },
  { terme: "il palazzo", definition: "immeuble ; le mot peut aussi désigner un palais", type: "" },
  { terme: "il piano", definition: "étage ; un plan de ville se dit mappa", type: "" },
  { terme: "le scale", definition: "escalier", type: "" },
  { terme: "l'interno (m.)", definition: "numéro d'appartement dans un immeuble", type: "" },
  { terme: "il cortile", definition: "cour intérieure", type: "" },
  { terme: "il balcone", definition: "balcon", type: "" },
  { terme: "l'ospedale (m.)", definition: "hôpital", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "girare a destra", definition: "tourner à droite", type: "" },
  { terme: "girare a sinistra", definition: "tourner à gauche", type: "" },
  { terme: "andare dritto", definition: "aller tout droit", type: "" },
  { terme: "attraversare", definition: "traverser une rue", type: "" },
  { terme: "perdersi", definition: "se perdre", type: "" },
  { terme: "chiedere la strada", definition: "demander son chemin", type: "" },
  { terme: "abitare", definition: "habiter", type: "" },
  { terme: "raggiungere", definition: "rejoindre un lieu", type: "" },
  { terme: "salire", definition: "monter ; salir se dit sporcare", type: "" },
  { terme: "scendere dall'autobus", definition: "descendre du bus", type: "" },
  { terme: "prendere la metro", definition: "prendre le métro", type: "" },
  { terme: "obliterare il biglietto", definition: "valider un titre de transport dans la machine", type: "" },
  { terme: "orientarsi", definition: "s'orienter", type: "" },
  { terme: "imboccare", definition: "s'engager dans une rue", type: "" },
  { terme: "sbucare", definition: "déboucher sur une place ou une rue", type: "" },
  // —— 20 expressions ——
  { terme: "prendere una cantonata", definition: "se tromper lourdement", type: "expression" },
  { terme: "conoscere come le proprie tasche", definition: "connaître un lieu dans ses moindres détails", type: "expression" },
  { terme: "a due passi", definition: "à une très courte distance", type: "expression" },
  { terme: "sotto casa", definition: "juste à côté de chez soi", type: "expression" },
  { terme: "essere sulla buona strada", definition: "avancer dans la bonne direction", type: "expression" },
  { terme: "girare a vuoto", definition: "tourner sans aboutir", type: "expression" },
  { terme: "perdersi in un bicchier d'acqua", definition: "se bloquer sur un détail minuscule", type: "expression" },
  { terme: "in capo al mondo", definition: "dans un endroit très éloigné", type: "expression" },
  { terme: "avere la strada spianata", definition: "n'avoir plus d'obstacle devant soi", type: "expression" },
  { terme: "essere dietro l'angolo", definition: "être sur le point d'arriver", type: "expression" },
  { terme: "svoltare l'angolo", definition: "sortir d'une période difficile", type: "expression" },
  { terme: "avere i piedi per terra", definition: "rester réaliste", type: "expression" },
  { terme: "chiudere la porta in faccia", definition: "repousser quelqu'un sans ménagement", type: "expression" },
  { terme: "bussare alla porta giusta", definition: "s'adresser à la personne qui peut aider", type: "expression" },
  { terme: "Roma non è stata costruita in un giorno", definition: "une œuvre importante demande du temps", type: "expression" },
  { terme: "essere in un vicolo cieco", definition: "ne plus voir d'issue", type: "expression" },
  { terme: "fare il giro largo", definition: "éviter un obstacle en faisant un détour", type: "expression" },
  { terme: "essere di passaggio", definition: "ne rester que peu de temps", type: "expression" },
  { terme: "non sapere che pesci prendere", definition: "ne pas savoir par où commencer", type: "expression" },
  { terme: "sfondare una porta aperta", definition: "s'acharner pour un résultat déjà acquis", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-16-ville-orientation.xlsx"));
