/**
 * Pack 9 — Technologie & sciences (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el ordenador", definition: "ordinateur", type: "" },
  { terme: "el portátil", definition: "ordinateur portable", type: "" },
  { terme: "el móvil", definition: "téléphone portable", type: "" },
  { terme: "la pantalla", definition: "écran", type: "" },
  { terme: "el teclado", definition: "clavier", type: "" },
  { terme: "el ratón", definition: "souris d'ordinateur", type: "" },
  { terme: "el usuario", definition: "utilisateur", type: "" },
  { terme: "la aplicación", definition: "application", type: "" },
  { terme: "el programa", definition: "programme informatique", type: "" },
  { terme: "el archivo", definition: "fichier", type: "" },
  { terme: "la carpeta digital", definition: "dossier numérique", type: "" },
  { terme: "la nube informática", definition: "informatique en nuage", type: "" },
  { terme: "el servidor", definition: "serveur", type: "" },
  { terme: "la red", definition: "réseau informatique", type: "" },
  { terme: "el wifi", definition: "réseau sans fil", type: "" },
  { terme: "la batería", definition: "batterie", type: "" },
  { terme: "el cargador", definition: "chargeur", type: "" },
  { terme: "el cable", definition: "câble", type: "" },
  { terme: "el enchufe", definition: "prise de courant", type: "" },
  { terme: "la impresora", definition: "imprimante", type: "" },
  { terme: "el robot", definition: "robot", type: "" },
  { terme: "la inteligencia artificial", definition: "intelligence artificielle", type: "" },
  { terme: "el código", definition: "code", type: "" },
  { terme: "el fallo", definition: "panne", type: "" },
  { terme: "la base de datos", definition: "base de données", type: "" },
  { terme: "el cifrado", definition: "chiffrement", type: "" },
  { terme: "la huella digital", definition: "empreinte digitale", type: "" },
  { terme: "el sensor", definition: "capteur", type: "" },
  { terme: "el dron", definition: "drone", type: "" },
  { terme: "el satélite", definition: "satellite", type: "" },
  { terme: "el laboratorio", definition: "laboratoire", type: "" },
  { terme: "el experimento", definition: "expérience de laboratoire", type: "" },
  { terme: "la hipótesis", definition: "hypothèse", type: "" },
  { terme: "la teoría", definition: "théorie", type: "" },
  { terme: "la prueba", definition: "preuve expérimentale", type: "" },
  { terme: "la muestra", definition: "échantillon", type: "" },
  { terme: "el microscopio", definition: "microscope", type: "" },
  { terme: "el telescopio", definition: "télescope", type: "" },
  { terme: "la célula", definition: "cellule", type: "" },
  { terme: "el átomo", definition: "atome", type: "" },
  { terme: "la molécula", definition: "molécule", type: "" },
  { terme: "la energía", definition: "énergie", type: "" },
  { terme: "la gravedad", definition: "pesanteur", type: "" },
  { terme: "la velocidad", definition: "vitesse", type: "" },
  { terme: "la temperatura", definition: "température", type: "" },
  { terme: "el grado Celsius", definition: "degré Celsius", type: "" },
  { terme: "la ecuación", definition: "équation", type: "" },
  { terme: "la fórmula", definition: "formule", type: "" },
  { terme: "el invento", definition: "invention", type: "" },
  { terme: "el inventor", definition: "inventeur", type: "" },
  { terme: "la patente", definition: "brevet", type: "" },
  { terme: "la investigación", definition: "recherche scientifique", type: "" },
  { terme: "el científico", definition: "scientifique", type: "" },
  { terme: "la ciencia", definition: "science", type: "" },
  { terme: "el dato", definition: "donnée", type: "" },
  { terme: "la estadística", definition: "statistique", type: "" },
  { terme: "el gráfico", definition: "graphique", type: "" },
  { terme: "la simulación", definition: "simulation", type: "" },
  { terme: "el prototipo", definition: "prototype", type: "" },
  { terme: "la innovación", definition: "innovation", type: "" },
  { terme: "el chip", definition: "puce électronique", type: "" },
  { terme: "el almacenamiento", definition: "stockage", type: "" },
  { terme: "la actualización", definition: "mise à jour", type: "" },
  { terme: "el enlace", definition: "lien hypertexte", type: "" },
  { terme: "el descubrimiento", definition: "découverte", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "grabar", definition: "enregistrer un son ou une vidéo", type: "" },
  { terme: "programar", definition: "programmer", type: "" },
  { terme: "reiniciar", definition: "redémarrer", type: "" },
  { terme: "actualizar", definition: "mettre à jour", type: "" },
  { terme: "instalar", definition: "installer", type: "" },
  { terme: "borrar", definition: "effacer", type: "" },
  { terme: "conectar", definition: "brancher", type: "" },
  { terme: "desconectar", definition: "débrancher", type: "" },
  { terme: "hacer clic", definition: "cliquer", type: "" },
  { terme: "pegar", definition: "coller un texte", type: "" },
  { terme: "copiar un archivo", definition: "copier un fichier", type: "" },
  { terme: "guardar un archivo", definition: "enregistrer un fichier", type: "" },
  { terme: "averiarse", definition: "tomber en panne", type: "" },
  { terme: "investigar", definition: "mener une recherche", type: "" },
  { terme: "medir", definition: "mesurer", type: "" },
  // —— 20 expressions ——
  { terme: "no tener ni pies ni cabeza", definition: "n'avoir ni queue ni tête", type: "expression" },
  { terme: "estar en pañales", definition: "en être aux balbutiements", type: "expression" },
  { terme: "no inventar la pólvora", definition: "ne rien inventer d'extraordinaire", type: "expression" },
  { terme: "ser ciencia ficción", definition: "relever de l'irréel", type: "expression" },
  { terme: "perder los papeles", definition: "perdre ses moyens", type: "expression" },
  { terme: "el talón de Aquiles", definition: "le point faible", type: "expression" },
  { terme: "abrir la caja de Pandora", definition: "ouvrir la boîte de Pandore", type: "expression" },
  { terme: "estar verde", definition: "manquer encore d'expérience", type: "expression" },
  { terme: "saber latín", definition: "en connaître un rayon", type: "expression" },
  { terme: "no ver más allá de sus narices", definition: "ne pas voir plus loin que le bout de son nez", type: "expression" },
  { terme: "hacer castillos en el aire", definition: "bâtir des châteaux en Espagne", type: "expression" },
  { terme: "de cabo a rabo", definition: "de bout en bout", type: "expression" },
  { terme: "sin ton ni son", definition: "sans rime ni raison", type: "expression" },
  { terme: "iluminársele la bombilla", definition: "avoir une idée soudaine", type: "expression" },
  { terme: "darle vueltas", definition: "tourner et retourner un problème", type: "expression" },
  { terme: "no cuadrar", definition: "ne pas tomber juste", type: "expression" },
  { terme: "ser coser y cantar", definition: "être d'une simplicité enfantine", type: "expression" },
  { terme: "a ciencia cierta", definition: "en toute certitude", type: "expression" },
  { terme: "quedar en evidencia", definition: "être pris en défaut", type: "expression" },
  { terme: "ser un cerebro", definition: "être une tête", type: "expression" },
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
