/**
 * Vérifie l'absence de doublons de terme (insensible à la casse)
 * et de définitions identiques ou très proches entre les build-pack-*.mjs.
 *
 * Usage : node shop-packs/esp/check-duplicates.mjs
 * Code sortie 1 si doublon trouvé.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ROW_RE = /\{\s*terme:\s*"((?:\\.|[^"\\])*)"\s*,\s*definition:\s*"((?:\\.|[^"\\])*)"\s*,/g;

function loadPack(path) {
  const text = readFileSync(path, "utf8");
  const rows = [];
  for (const match of text.matchAll(ROW_RE)) {
    rows.push({ terme: match[1], definition: match[2] });
  }
  return rows;
}

/** @param {string} def */
function normalizeDef(def) {
  return def
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Premier mot-clé significatif (hors articles). */
function firstKeyword(def) {
  const stop = new Set(["le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "à", "au", "en"]);
  const words = normalizeDef(def).split(/[\s,;()]+/).filter(Boolean);
  for (const w of words) {
    if (!stop.has(w)) return w;
  }
  return words[0] ?? "";
}

const files = readdirSync(__dirname)
  .filter((name) => /^build-pack-\d+\.mjs$/.test(name))
  .sort();

/** @type {Map<string, { pack: string, terme: string }[]>} */
const termMap = new Map();
/** @type {Map<string, { pack: string, terme: string, definition: string }[]>} */
const defMap = new Map();
/** @type {Map<string, { pack: string, terme: string, definition: string }[]>} */
const keywordMap = new Map();

let totalRows = 0;
let failed = false;

for (const file of files) {
  const packId = file.replace(/^build-(\d+)\.mjs$/, "pack-$1").replace(/^build-pack-(\d+)\.mjs$/, "pack-$1");
  const pid = file.match(/build-(pack-\d+)/)?.[1] ?? file;
  const rows = loadPack(join(__dirname, file));
  totalRows += rows.length;
  if (rows.length !== 100) {
    console.error(`[${pid}] ${rows.length} lignes (attendu 100) — ${file}`);
    failed = true;
  }
  for (const row of rows) {
    const termKey = row.terme.trim().toLowerCase();
    if (!termMap.has(termKey)) termMap.set(termKey, []);
    termMap.get(termKey).push({ pack: pid, terme: row.terme });

    const defKey = normalizeDef(row.definition);
    if (!defMap.has(defKey)) defMap.set(defKey, []);
    defMap.get(defKey).push({ pack: pid, terme: row.terme, definition: row.definition });

    const kw = firstKeyword(row.definition);
    if (kw) {
      if (!keywordMap.has(kw)) keywordMap.set(kw, []);
      keywordMap.get(kw).push({ pack: pid, terme: row.terme, definition: row.definition });
    }
  }
}

console.log(`Fichiers analysés : ${files.length} (${totalRows} entrées au total)\n`);

console.log("=== Doublons de TERMES entre packs ===");
let termDups = false;
for (const [, hits] of [...termMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const packs = new Set(hits.map((h) => h.pack));
  if (packs.size > 1) {
    termDups = true;
    failed = true;
    console.log(`"${hits[0].terme}" → ${hits.map((h) => h.pack).join(", ")}`);
  }
}
if (!termDups) console.log("(aucun)");

console.log("\n=== Définitions IDENTIQUES entre packs ===");
let defDups = false;
for (const [, hits] of [...defMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (!hits[0].definition.trim() || hits.length < 2) continue;
  const packs = new Set(hits.map((h) => h.pack));
  if (packs.size > 1) {
    defDups = true;
    failed = true;
    console.log(`« ${hits[0].definition} » → ${hits.map((h) => `${h.pack} (${h.terme})`).join(" | ")}`);
  }
}
if (!defDups) console.log("(aucun)");

console.log("\n=== Définitions proches (même premier mot-clé, packs différents) ===");
let kwDups = false;
for (const [kw, hits] of [...keywordMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (hits.length < 2) continue;
  const byDef = new Map();
  for (const h of hits) {
    const dk = normalizeDef(h.definition);
    if (!byDef.has(dk)) byDef.set(dk, []);
    byDef.get(dk).push(h);
  }
  if (byDef.size <= 1) continue;
  const packs = new Set(hits.map((h) => h.pack));
  if (packs.size > 1) {
    kwDups = true;
    console.log(`Mot-clé « ${kw} » :`);
    for (const [, group] of byDef) {
      console.log(`  → ${group.map((h) => `${h.pack} (${h.terme}) : ${h.definition}`).join(" | ")}`);
    }
  }
}
if (!kwDups) console.log("(aucun groupe ambigu signalé)");

if (!failed) {
  console.log("\nAucun doublon de terme ni définition identique entre packs.");
  process.exit(0);
}
console.error("\nÉchec : corriger les doublons ci-dessus.");
process.exit(1);
