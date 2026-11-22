/**
 * Pack 2 — Voyage & transports (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la carta d'imbarco", definition: "carte d'embarquement", type: "" },
  { terme: "il ritiro bagagli", definition: "retrait des bagages", type: "" },
  { terme: "lo scalo", definition: "escale", type: "" },
  { terme: "il tempo di coincidenza", definition: "délai pour changer de train ou d'avion", type: "" },
  { terme: "il bagaglio", definition: "bagage", type: "" },
  { terme: "la valigia", definition: "valise", type: "" },
  { terme: "la partenza", definition: "départ d'un avion ou d'un train", type: "" },
  { terme: "l'arrivo (m.)", definition: "arrivée", type: "" },
  { terme: "il biglietto", definition: "titre de transport", type: "" },
  { terme: "il passeggero", definition: "passager", type: "" },
  { terme: "il volo in coincidenza", definition: "vol de correspondance", type: "" },
  { terme: "il volo diretto", definition: "vol sans escale", type: "" },
  { terme: "il volo intercontinentale", definition: "vol long-courrier", type: "" },
  { terme: "il volo breve", definition: "vol court-courrier", type: "" },
  { terme: "il volo notturno", definition: "vol de nuit", type: "" },
  { terme: "l'overbooking (m.)", definition: "surréservation", type: "" },
  { terme: "la mancata presentazione", definition: "absence d'un passager qui avait réservé", type: "" },
  { terme: "il banco accettazione", definition: "comptoir d'enregistrement", type: "" },
  { terme: "l'uscita d'imbarco (f.)", definition: "porte d'embarquement", type: "" },
  { terme: "la pista di decollo", definition: "piste de décollage", type: "" },
  { terme: "la dichiarazione doganale", definition: "déclaration en douane", type: "" },
  { terme: "esente da dazio", definition: "hors taxes", type: "" },
  { terme: "il controllo passaporti", definition: "contrôle des passeports", type: "" },
  { terme: "l'esenzione dal visto (f.)", definition: "entrée sans visa", type: "" },
  { terme: "l'avviso ai viaggiatori (m.)", definition: "avis déconseillant un déplacement", type: "" },
  { terme: "il viaggio organizzato", definition: "voyage en circuit", type: "" },
  { terme: "l'andata e ritorno (f.)", definition: "billet aller-retour", type: "" },
  { terme: "la sola andata", definition: "trajet aller simple", type: "" },
  { terme: "l'ora di punta (f.)", definition: "heures de pointe", type: "" },
  { terme: "la navetta", definition: "navette", type: "" },
  { terme: "l'auto a noleggio (f.)", definition: "voiture de location", type: "" },
  { terme: "la corsia di emergenza", definition: "bande d'arrêt d'urgence", type: "" },
  { terme: "il pedaggio", definition: "péage", type: "" },
  { terme: "la zona a traffico limitato", definition: "zone urbaine où la circulation est restreinte", type: "" },
  { terme: "il senso unico", definition: "rue à sens unique", type: "" },
  { terme: "l'area pedonale (f.)", definition: "zone piétonne", type: "" },
  { terme: "la pista ciclabile", definition: "piste cyclable", type: "" },
  { terme: "il binario", definition: "voie de gare, que l'on annonce à la place du quai", type: "" },
  { terme: "il treno ad alta velocità", definition: "train à grande vitesse", type: "" },
  { terme: "la carrozza letto", definition: "voiture-couchettes", type: "" },
  { terme: "il traghetto", definition: "ferry", type: "" },
  { terme: "la nave da crociera", definition: "paquebot de croisière", type: "" },
  { terme: "il terminal", definition: "aérogare", type: "" },
  { terme: "il bagaglio a mano", definition: "bagage cabine", type: "" },
  { terme: "il bagaglio in stiva", definition: "bagage enregistré en soute", type: "" },
  { terme: "la prenotazione del posto", definition: "réservation de siège", type: "" },
  { terme: "il posto corridoio", definition: "siège côté couloir", type: "" },
  { terme: "il posto finestrino", definition: "siège côté hublot", type: "" },
  { terme: "la coincidenza", definition: "correspondance", type: "" },
  { terme: "il ritardo", definition: "retard de transport", type: "" },
  { terme: "la penale di cancellazione", definition: "frais d'annulation", type: "" },
  { terme: "l'assicurazione di viaggio (f.)", definition: "assurance voyage", type: "" },
  { terme: "il jet lag", definition: "fatigue due au décalage horaire", type: "" },
  { terme: "l'ufficio cambi (m.)", definition: "bureau de change", type: "" },
  { terme: "la patente internazionale", definition: "permis de conduire international", type: "" },
  { terme: "l'ingorgo stradale (m.)", definition: "embouteillage", type: "" },
  { terme: "la deviazione", definition: "déviation", type: "" },
  { terme: "il passaggio in auto", definition: "place en covoiturage", type: "" },
  { terme: "l'orario ferroviario (m.)", definition: "horaires des trains", type: "" },
  { terme: "l'ufficio oggetti smarriti (m.)", definition: "service des objets trouvés", type: "" },
  { terme: "il deposito bagagli", definition: "consigne à bagages", type: "" },
  { terme: "la stazione di scambio", definition: "gare où l'on change de train", type: "" },
  { terme: "la franchigia bagagli", definition: "poids de bagages inclus dans le billet", type: "" },
  { terme: "la lista d'attesa", definition: "liste d'attente", type: "" },
  { terme: "il passaporto", definition: "passeport", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "partire", definition: "quitter un lieu", type: "" },
  { terme: "decollare", definition: "décoller", type: "" },
  { terme: "atterrare", definition: "toucher la piste", type: "" },
  { terme: "fare il check-in", definition: "obtenir sa carte d'embarquement", type: "" },
  { terme: "accostare", definition: "s'arrêter le long du bord de la route", type: "" },
  { terme: "far scendere qualcuno", definition: "déposer quelqu'un en chemin", type: "" },
  { terme: "passare a prendere", definition: "aller chercher quelqu'un", type: "" },
  { terme: "imbarcarsi", definition: "monter à bord d'un bateau ou d'un avion", type: "" },
  { terme: "sbarcare", definition: "descendre d'un bateau ou d'un avion", type: "" },
  { terme: "fare rifornimento", definition: "remplir le réservoir", type: "" },
  { terme: "cambiare mezzo", definition: "prendre une correspondance", type: "" },
  { terme: "tornare da un viaggio", definition: "rentrer d'un déplacement", type: "" },
  { terme: "allacciare la cintura", definition: "attacher sa ceinture de sécurité", type: "" },
  { terme: "essere in ritardo", definition: "avoir du retard", type: "" },
  { terme: "mettersi in viaggio", definition: "démarrer un trajet", type: "" },
  // —— 20 expressions ——
  { terme: "perdere il treno", definition: "au sens figuré, laisser passer une occasion", type: "expression" },
  { terme: "trovarsi a un bivio", definition: "être devant un choix qui engage", type: "expression" },
  { terme: "andare a gonfie vele", definition: "marcher à plein succès", type: "expression" },
  { terme: "per il rotto della cuffia", definition: "y arriver de justesse", type: "expression" },
  { terme: "partire in quarta", definition: "s'emporter d'un coup, ou démarrer à toute allure", type: "expression" },
  { terme: "mandare da Erode a Pilato", definition: "renvoyer quelqu'un de guichet en guichet", type: "expression" },
  { terme: "tutte le strade portano a Roma", definition: "atteindre le même but par des chemins différents", type: "expression" },
  { terme: "avere il vento in poppa", definition: "avoir les circonstances pour soi", type: "expression" },
  { terme: "essere fuori strada", definition: "se tromper de raisonnement", type: "expression" },
  { terme: "tagliare la corda", definition: "filer sans prévenir", type: "expression" },
  { terme: "levare le tende", definition: "quitter un endroit pour de bon", type: "expression" },
  { terme: "chi va piano va sano e va lontano", definition: "arriver plus sûrement en ne se pressant pas", type: "expression" },
  { terme: "essere una trottola", definition: "ne pas tenir en place", type: "expression" },
  { terme: "fuori dai sentieri battuti", definition: "loin de ce que tout le monde fait", type: "expression" },
  { terme: "alzare i tacchi", definition: "partir brusquement", type: "expression" },
  { terme: "prendere il largo", definition: "s'éloigner pour échapper à une situation", type: "expression" },
  { terme: "andare a rotta di collo", definition: "se déplacer à une vitesse dangereuse", type: "expression" },
  { terme: "perdere la bussola", definition: "ne plus savoir où l'on en est", type: "expression" },
  { terme: "remare controcorrente", definition: "agir à l'opposé du mouvement général", type: "expression" },
  { terme: "arrivare in porto", definition: "mener un projet jusqu'à son terme", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-02-voyage-transports.xlsx"));
