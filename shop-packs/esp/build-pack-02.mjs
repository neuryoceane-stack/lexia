/**
 * Pack 2 — Voyage & transports (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la tarjeta de embarque", definition: "carte d'embarquement", type: "" },
  { terme: "la cinta de equipajes", definition: "tapis de retrait des bagages", type: "" },
  { terme: "la escala", definition: "escale", type: "" },
  { terme: "el tiempo de enlace", definition: "temps pour changer de train ou d'avion", type: "" },
  { terme: "el equipaje", definition: "bagages", type: "" },
  { terme: "la maleta", definition: "valise", type: "" },
  { terme: "la salida del vuelo", definition: "départ d'un vol", type: "" },
  { terme: "la llegada", definition: "arrivée", type: "" },
  { terme: "el billete", definition: "billet de train ou de bus", type: "" },
  { terme: "el pasajero", definition: "passager", type: "" },
  { terme: "el vuelo de enlace", definition: "vol de correspondance", type: "" },
  { terme: "el vuelo directo", definition: "vol sans escale", type: "" },
  { terme: "el vuelo de larga distancia", definition: "vol long-courrier", type: "" },
  { terme: "el vuelo de corta distancia", definition: "vol court-courrier", type: "" },
  { terme: "el vuelo nocturno", definition: "vol de nuit", type: "" },
  { terme: "la sobreventa", definition: "surréservation", type: "" },
  { terme: "la no presentación", definition: "absence d'un passager annoncé", type: "" },
  { terme: "el mostrador de facturación", definition: "comptoir d'enregistrement", type: "" },
  { terme: "la puerta de embarque", definition: "porte d'embarquement", type: "" },
  { terme: "la pista de despegue", definition: "piste de décollage", type: "" },
  { terme: "la declaración de aduanas", definition: "déclaration en douane", type: "" },
  { terme: "libre de impuestos", definition: "hors taxes", type: "" },
  { terme: "el control de pasaportes", definition: "contrôle des passeports", type: "" },
  { terme: "la exención de visado", definition: "entrée sans visa", type: "" },
  { terme: "la recomendación de viaje", definition: "avis officiel sur un déplacement", type: "" },
  { terme: "el viaje organizado", definition: "voyage en circuit", type: "" },
  { terme: "el billete de ida y vuelta", definition: "billet aller-retour", type: "" },
  { terme: "el billete de ida", definition: "trajet aller simple", type: "" },
  { terme: "la hora punta", definition: "heures de pointe", type: "" },
  { terme: "la lanzadera", definition: "navette", type: "" },
  { terme: "el coche de alquiler", definition: "voiture de location", type: "" },
  { terme: "el arcén", definition: "bande d'arrêt d'urgence", type: "" },
  { terme: "el peaje", definition: "péage", type: "" },
  { terme: "la zona de bajas emisiones", definition: "zone urbaine à circulation restreinte", type: "" },
  { terme: "la calle de sentido único", definition: "rue à sens unique", type: "" },
  { terme: "la zona peatonal", definition: "zone piétonne", type: "" },
  { terme: "el carril bici", definition: "piste cyclable", type: "" },
  { terme: "el andén", definition: "quai de gare", type: "" },
  { terme: "el tren AVE", definition: "train à grande vitesse en Espagne", type: "" },
  { terme: "el coche cama", definition: "voiture-couchettes", type: "" },
  { terme: "el ferri", definition: "ferry", type: "" },
  { terme: "el crucero", definition: "paquebot de croisière", type: "" },
  { terme: "la terminal", definition: "aérogare", type: "" },
  { terme: "el equipaje de mano", definition: "bagage cabine", type: "" },
  { terme: "el equipaje facturado", definition: "bagage enregistré en soute", type: "" },
  { terme: "la reserva de asiento", definition: "réservation de siège", type: "" },
  { terme: "el asiento de pasillo", definition: "siège côté couloir", type: "" },
  { terme: "el asiento de ventanilla", definition: "siège côté hublot", type: "" },
  { terme: "el transbordo", definition: "correspondance", type: "" },
  { terme: "el retraso", definition: "retard de transport", type: "" },
  { terme: "los gastos de cancelación", definition: "frais d'annulation", type: "" },
  { terme: "el seguro de viaje", definition: "assurance voyage", type: "" },
  { terme: "el desfase horario", definition: "décalage horaire", type: "" },
  { terme: "la casa de cambio", definition: "bureau de change", type: "" },
  { terme: "el permiso internacional de conducir", definition: "permis de conduire international", type: "" },
  { terme: "el atasco", definition: "embouteillage", type: "" },
  { terme: "el desvío", definition: "déviation", type: "" },
  { terme: "la plaza en coche compartido", definition: "place en covoiturage", type: "" },
  { terme: "el horario de trenes", definition: "horaires des trains", type: "" },
  { terme: "la oficina de objetos perdidos", definition: "service des objets trouvés", type: "" },
  { terme: "la consigna", definition: "consigne à bagages", type: "" },
  { terme: "la estación de enlace", definition: "gare de correspondance", type: "" },
  { terme: "la franquicia de equipaje", definition: "poids de bagages inclus dans le billet", type: "" },
  { terme: "la lista de espera", definition: "liste d'attente", type: "" },
  { terme: "el pasaporte", definition: "passeport", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "salir", definition: "partir, quitter un arrêt", type: "" },
  { terme: "despegar", definition: "décoller", type: "" },
  { terme: "aterrizar", definition: "atterrir", type: "" },
  { terme: "detenerse", definition: "s'arrêter", type: "" },
  { terme: "acercar", definition: "déposer quelqu'un en voiture", type: "" },
  { terme: "recoger", definition: "passer prendre quelqu'un", type: "" },
  { terme: "arrancar", definition: "démarrer", type: "" },
  { terme: "retrasar", definition: "retarder", type: "" },
  { terme: "frenar", definition: "freiner", type: "" },
  { terme: "repostar", definition: "faire le plein", type: "" },
  { terme: "subir", definition: "monter dans un transport, et non « subir »", type: "" },
  { terme: "bajar", definition: "descendre d'un transport", type: "" },
  { terme: "hacer transbordo", definition: "changer de moyen de transport", type: "" },
  { terme: "regresar", definition: "rentrer d'un voyage", type: "" },
  { terme: "compartir coche", definition: "faire route ensemble en voiture", type: "" },
  // —— 20 expressions ——
  { terme: "ponerse en camino", definition: "se mettre en route", type: "expression" },
  { terme: "fuera de los caminos trillados", definition: "hors des sentiers battus", type: "expression" },
  { terme: "el mundo es un pañuelo", definition: "le monde est petit", type: "expression" },
  { terme: "perder el tren", definition: "rater le bon moment", type: "expression" },
  { terme: "estar en una encrucijada", definition: "être face à un choix décisif", type: "expression" },
  { terme: "estar de aquí para allá", definition: "être sans cesse en déplacement", type: "expression" },
  { terme: "salir pitando", definition: "filer immédiatement", type: "expression" },
  { terme: "ir sobre ruedas", definition: "se dérouler sans accroc", type: "expression" },
  { terme: "llegar por los pelos", definition: "y arriver de justesse", type: "expression" },
  { terme: "pisar el acelerador", definition: "accélérer à fond", type: "expression" },
  { terme: "cambiar de aires", definition: "partir pour se changer les idées", type: "expression" },
  { terme: "ir de la Ceca a la Meca", definition: "courir d'un guichet à l'autre", type: "expression" },
  { terme: "todos los caminos llevan a Roma", definition: "plusieurs chemins vers le même but", type: "expression" },
  { terme: "dar un volantazo", definition: "changer brusquement de direction", type: "expression" },
  { terme: "estar hasta el cuello de papeles", definition: "crouler sous les formalités", type: "expression" },
  { terme: "tomar el rábano por las hojas", definition: "comprendre une chose à l'envers", type: "expression" },
  { terme: "en el quinto pino", definition: "dans un endroit très isolé", type: "expression" },
  { terme: "poner tierra de por medio", definition: "prendre de la distance", type: "expression" },
  { terme: "hacer mutis por el foro", definition: "s'éclipser discrètement", type: "expression" },
  { terme: "armarse de paciencia", definition: "s'armer de patience", type: "expression" },
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
