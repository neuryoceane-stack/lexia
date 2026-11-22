/**
 * Pack 13 — Argent & économie (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "coin", definition: "pièce de monnaie", type: "" },
  { terme: "banknote", definition: "billet de banque", type: "" },
  { terme: "cash", definition: "espèces", type: "" },
  { terme: "currency", definition: "devise", type: "" },
  { terme: "euro", definition: "euro", type: "" },
  { terme: "dollar", definition: "dollar", type: "" },
  { terme: "exchange rate", definition: "taux de change", type: "" },
  { terme: "inflation", definition: "inflation", type: "" },
  { terme: "deflation", definition: "déflation", type: "" },
  { terme: "interest rate", definition: "taux d'intérêt", type: "" },
  { terme: "loan", definition: "prêt", type: "" },
  { terme: "mortgage", definition: "emprunt immobilier", type: "" },
  { terme: "savings", definition: "épargne", type: "" },
  { terme: "bank", definition: "banque", type: "" },
  { terme: "ATM", definition: "distributeur automatique", type: "" },
  { terme: "credit card", definition: "carte bancaire", type: "" },
  { terme: "debit card", definition: "carte de débit", type: "" },
  { terme: "pin code", definition: "code secret", type: "" },
  { terme: "overdraft", definition: "découvert bancaire", type: "" },
  { terme: "budget", definition: "budget", type: "" },
  { terme: "expense", definition: "dépense", type: "" },
  { terme: "income", definition: "revenu", type: "" },
  { terme: "profit", definition: "bénéfice", type: "" },
  { terme: "loss", definition: "perte", type: "" },
  { terme: "revenue", definition: "chiffre d'affaires", type: "" },
  { terme: "cost", definition: "coût", type: "" },
  { terme: "price", definition: "prix", type: "" },
  { terme: "fee", definition: "frais", type: "" },
  { terme: "tariff", definition: "tarif", type: "" },
  { terme: "bargain", definition: "bonne affaire", type: "" },
  { terme: "invest", definition: "investir", type: "" },
  { terme: "stock market", definition: "marché boursier", type: "" },
  { terme: "bond", definition: "titre obligataire", type: "" },
  { terme: "dividend", definition: "dividende", type: "" },
  { terme: "portfolio", definition: "portefeuille d'investissements", type: "" },
  { terme: "bankruptcy", definition: "faillite", type: "" },
  { terme: "recession", definition: "récession", type: "" },
  { terme: "economy", definition: "économie", type: "" },
  { terme: "marketplace", definition: "marché", type: "" },
  { terme: "trade", definition: "commerce", type: "" },
  { terme: "import", definition: "importation", type: "" },
  { terme: "export", definition: "exportation", type: "" },
  { terme: "consumer", definition: "consommateur", type: "" },
  { terme: "supplier", definition: "fournisseur", type: "" },
  { terme: "invoice", definition: "facture commerciale", type: "" },
  { terme: "refund", definition: "remboursement", type: "" },
  { terme: "allowance", definition: "allocation", type: "" },
  { terme: "pocket money", definition: "argent de poche", type: "" },
  { terme: "bursary", definition: "bourse scolaire", type: "" },
  { terme: "grant", definition: "subvention", type: "" },
  { terme: "toll", definition: "péage", type: "" },
  { terme: "ransom", definition: "rançon", type: "" },
  { terme: "net worth", definition: "patrimoine net", type: "" },
  { terme: "ledger", definition: "grand livre comptable", type: "" },
  { terme: "audit", definition: "audit", type: "" },
  { terme: "treasurer", definition: "trésorier", type: "" },
  { terme: "cashier", definition: "caissier", type: "" },
  { terme: "transaction", definition: "transaction", type: "" },
  { terme: "balance", definition: "solde", type: "" },
  { terme: "withdrawal", definition: "retrait", type: "" },
  { terme: "deposit", definition: "dépôt", type: "" },
  { terme: "broker", definition: "courtier", type: "" },
  { terme: "petty cash", definition: "caisse de petite monnaie", type: "" },
  { terme: "hedge fund", definition: "fonds spéculatif", type: "" },
  { terme: "money changer", definition: "changeur de devises", type: "" },
  { terme: "inheritance", definition: "héritage", type: "" },
  { terme: "pay off", definition: "rembourser (une dette)", type: "" },
  { terme: "save up", definition: "épargner", type: "" },
  { terme: "fork out", definition: "débourser", type: "" },
  { terme: "splash out", definition: "claquer (de l'argent)", type: "" },
  { terme: "cut back", definition: "réduire ses dépenses", type: "" },
  { terme: "run up", definition: "accumuler des dettes", type: "" },
  { terme: "bail out", definition: "sauver financièrement", type: "" },
  { terme: "pay back", definition: "rembourser", type: "" },
  { terme: "rip off", definition: "arnaquer", type: "" },
  { terme: "cash in", definition: "encaisser", type: "" },
  { terme: "cash out", definition: "retirer ses gains", type: "" },
  { terme: "chip in", definition: "participer aux frais", type: "" },
  { terme: "sell off", definition: "liquider", type: "" },
  { terme: "tighten up", definition: "resserrer son budget", type: "" },
  { terme: "bottom line", definition: "au bout du compte (argent)", type: "expression" },
  { terme: "a penny saved is a penny earned", definition: "l'épargne, c'est du revenu", type: "expression" },
  { terme: "time is money", definition: "le temps, c'est de l'argent", type: "expression" },
  { terme: "money doesn't grow on trees", definition: "l'argent ne pousse pas dans les arbres", type: "expression" },
  { terme: "live beyond your means", definition: "vivre au-dessus de ses moyens", type: "expression" },
  { terme: "pay through the nose", definition: "payer un prix exorbitant", type: "expression" },
  { terme: "feel the pinch", definition: "ressentir les difficultés financières", type: "expression" },
  { terme: "tighten your belt", definition: "serrer la ceinture", type: "expression" },
  { terme: "in the red", definition: "dans le rouge", type: "expression" },
  { terme: "in the black", definition: "en positif, bénéficiaire", type: "expression" },
  { terme: "a nest egg", definition: "un pécule", type: "expression" },
  { terme: "strike it rich", definition: "devenir riche", type: "expression" },
  { terme: "break the bank", definition: "vider sa caisse", type: "expression" },
  { terme: "on a shoestring", definition: "avec un budget serré", type: "expression" },
  { terme: "throw money down the drain", definition: "gaspiller son argent", type: "expression" },
  { terme: "put your money where your mouth is", definition: "passer aux actes", type: "expression" },
  { terme: "rags to riches", definition: "de la misère à la fortune", type: "expression" },
  { terme: "filthy rich", definition: "richissime", type: "expression" },
  { terme: "a golden opportunity", definition: "une opportunité en or", type: "expression" },
  { terme: "cash cow", definition: "vache à lait", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-13-argent-economie.xlsx"));