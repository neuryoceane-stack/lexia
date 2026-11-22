/**
 * Vérifie l'absence de doublons de terme (insensible à la casse)
 * et de définition identique entre les build-pack-*.mjs.
 *
 * Usage : node shop-packs/eng/check-duplicates.mjs
 * Code sortie 1 si doublon trouvé.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ROW_RE = /\{\s*terme:\s*"([^"]+)"\s*,\s*definition:\s*"([^"]*)"\s*,/g;

function loadPack(path) {
  const text = readFileSync(path, "utf8");
  const rows = [];
  for (const match of text.matchAll(ROW_RE)) {
    rows.push({ terme: match[1], definition: match[2] });
  }
  return rows;
}

const files = readdirSync(__dirname)
  .filter((name) => /^build-pack-\d+\.mjs$/.test(name))
  .sort();

/** @type {Map<string, { pack: string, terme: string }[]>} */
const termMap = new Map();
/** @type {Map<string, { pack: string, terme: string }[]>} */
const defMap = new Map();

let totalRows = 0;

for (const file of files) {
  const pack = file.replace(/^build-|-\d+\.mjs$/g, "").replace("pack-", "pack-");
  const packId = file.match(/build-(pack-\d+)/)?.[1] ?? file;
  const rows = loadPack(join(__dirname, file));
  totalRows += rows.length;
  if (rows.length !== 100) {
    console.error(`[${packId}] ${rows.length} lignes (attendu 100) — ${file}`);
  }
  for (const row of rows) {
    const termKey = row.terme.trim().toLowerCase();
  const defKey = row.definition.trim().toLowerCase();
    if (!termMap.has(termKey)) termMap.set(termKey, []);
    termMap.get(termKey).push({ pack: packId, terme: row.terme });
    if (!defMap.has(defKey)) defMap.set(defKey, []);
    defMap.get(defKey).push({ pack: packId, terme: row.terme, definition: row.definition });
  }
}

let failed = false;

console.log(`Fichiers analysés : ${files.length} (${totalRows} entrées au total)\n`);

console.log("=== Doublons de TERMES entre packs ===");
for (const [key, hits] of [...termMap.entries()].sort()) {
  const packs = new Set(hits.map((h) => h.pack));
  if (packs.size > 1) {
    failed = true;
    console.log(`"${hits[0].terme}" (${key}) → ${hits.map((h) => h.pack).join(", ")}`);
  }
}

console.log("\n=== Doublons de DÉFINITIONS identiques entre packs ===");
for (const [key, hits] of [...defMap.entries()].sort()) {
  if (!key || hits.length < 2) continue;
  const packs = new Set(hits.map((h) => h.pack));
  if (packs.size > 1) {
    failed = true;
    console.log(`« ${hits[0].definition} » → ${hits.map((h) => `${h.pack} (${h.terme})`).join(" | ")}`);
  }
}

if (!failed) {
  console.log("\nAucun doublon inter-packs détecté.");
  process.exit(0);
}
console.error("\nÉchec : corriger les doublons ci-dessus.");
process.exit(1);