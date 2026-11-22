/**
 * Pack 13 — Argent & économie (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la banca", definition: "banque", type: "" },
  { terme: "il conto corrente", definition: "compte courant", type: "" },
  { terme: "il bancomat", definition: "distributeur de billets ; le mot désigne aussi la carte de retrait", type: "" },
  { terme: "la carta di credito", definition: "carte de crédit", type: "" },
  { terme: "il codice fiscale", definition: "numéro d'identification fiscale, en Italie", type: "" },
  { terme: "l'IBAN (m.)", definition: "identifiant international d'un compte", type: "" },
  { terme: "il bonifico", definition: "virement", type: "" },
  { terme: "l'assegno (m.)", definition: "chèque", type: "" },
  { terme: "il contante", definition: "espèces", type: "" },
  { terme: "la moneta", definition: "pièce de monnaie", type: "" },
  { terme: "la banconota", definition: "billet de banque", type: "" },
  { terme: "la valuta", definition: "devise", type: "" },
  { terme: "il prezzo", definition: "prix", type: "" },
  { terme: "il costo", definition: "coût", type: "" },
  { terme: "la ricevuta", definition: "reçu", type: "" },
  { terme: "l'IVA (f.)", definition: "taxe sur la valeur ajoutée", type: "" },
  { terme: "l'imposta (f.)", definition: "impôt", type: "" },
  { terme: "la dichiarazione dei redditi", definition: "déclaration de revenus", type: "" },
  { terme: "il bilancio familiare", definition: "budget du foyer", type: "" },
  { terme: "la rata", definition: "mensualité", type: "" },
  { terme: "il risparmio", definition: "épargne", type: "" },
  { terme: "il prestito", definition: "prêt", type: "" },
  { terme: "il mutuo", definition: "crédit immobilier", type: "" },
  { terme: "il tasso di interesse", definition: "taux d'intérêt ; un blaireau se dit aussi tasso", type: "" },
  { terme: "l'inflazione (f.)", definition: "inflation", type: "" },
  { terme: "il PIL", definition: "produit intérieur brut", type: "" },
  { terme: "la disoccupazione", definition: "chômage", type: "" },
  { terme: "l'economia (f.)", definition: "économie", type: "" },
  { terme: "il mercato azionario", definition: "marché boursier", type: "" },
  { terme: "la Borsa", definition: "Bourse, le marché des actions", type: "" },
  { terme: "l'azione (f.)", definition: "action, titre d'une entreprise", type: "" },
  { terme: "l'investimento (m.)", definition: "investissement", type: "" },
  { terme: "il profitto", definition: "profit", type: "" },
  { terme: "la perdita", definition: "perte d'argent", type: "" },
  { terme: "il debito", definition: "dette", type: "" },
  { terme: "il creditore", definition: "créancier", type: "" },
  { terme: "il debitore", definition: "débiteur", type: "" },
  { terme: "la fattura", definition: "facture entre professionnels", type: "" },
  { terme: "il pagamento", definition: "paiement", type: "" },
  { terme: "il rimborso", definition: "remboursement", type: "" },
  { terme: "la cauzione", definition: "dépôt de garantie", type: "" },
  { terme: "l'acconto (m.)", definition: "acompte", type: "" },
  { terme: "il saldo", definition: "solde d'un compte", type: "" },
  { terme: "gratuito", definition: "gratuit", type: "" },
  { terme: "caro", definition: "cher, pour un prix", type: "" },
  { terme: "conveniente", definition: "avantageux, pour un prix", type: "" },
  { terme: "il reddito", definition: "revenu", type: "" },
  { terme: "il netto", definition: "montant net", type: "" },
  { terme: "il lordo", definition: "montant brut", type: "" },
  { terme: "la trattenuta", definition: "retenue sur un salaire", type: "" },
  { terme: "il consumatore", definition: "consommateur", type: "" },
  { terme: "l'offerta (f.)", definition: "offre, sur un marché", type: "" },
  { terme: "la domanda", definition: "demande, sur un marché ; le mot veut aussi dire question", type: "" },
  { terme: "la concorrenza", definition: "concurrence", type: "" },
  { terme: "il monopolio", definition: "monopole", type: "" },
  { terme: "la crisi economica", definition: "crise économique", type: "" },
  { terme: "la crescita", definition: "croissance économique", type: "" },
  { terme: "l'esportazione (f.)", definition: "exportation", type: "" },
  { terme: "l'importazione (f.)", definition: "importation", type: "" },
  { terme: "il commercio", definition: "commerce", type: "" },
  { terme: "il negozio", definition: "magasin", type: "" },
  { terme: "la cassa", definition: "caisse", type: "" },
  { terme: "il resto", definition: "monnaie rendue", type: "" },
  { terme: "l'affare (m.)", definition: "bonne affaire", type: "" },
  { terme: "il preventivo", definition: "devis", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "pagare", definition: "payer", type: "" },
  { terme: "risparmiare", definition: "mettre de l'argent de côté", type: "" },
  { terme: "spendere", definition: "dépenser", type: "" },
  { terme: "prestare", definition: "prêter", type: "" },
  { terme: "prendere in prestito", definition: "emprunter", type: "" },
  { terme: "investire", definition: "investir", type: "" },
  { terme: "versare sul conto", definition: "verser de l'argent sur un compte", type: "" },
  { terme: "prelevare", definition: "retirer de l'argent", type: "" },
  { terme: "ricaricare la carta", definition: "recharger une carte prépayée", type: "" },
  { terme: "rateizzare", definition: "étaler un paiement en plusieurs fois", type: "" },
  { terme: "indebitarsi", definition: "s'endetter", type: "" },
  { terme: "rimborsare", definition: "rembourser", type: "" },
  { terme: "confrontare i prezzi", definition: "comparer les prix", type: "" },
  { terme: "permettersi", definition: "avoir les moyens de s'offrir", type: "" },
  { terme: "guadagnare", definition: "gagner de l'argent", type: "" },
  // —— 20 expressions ——
  { terme: "essere al verde", definition: "ne plus avoir d'argent du tout", type: "expression" },
  { terme: "tirare la cinghia", definition: "réduire fortement ses dépenses", type: "expression" },
  { terme: "avere le mani bucate", definition: "être incapable de garder son argent", type: "expression" },
  { terme: "nuotare nell'oro", definition: "vivre dans l'abondance", type: "expression" },
  { terme: "non è tutt'oro quel che luccica", definition: "une belle apparence peut tromper", type: "expression" },
  { terme: "guadagnarsi il pane", definition: "gagner de quoi vivre", type: "expression" },
  { terme: "fare i conti senza l'oste", definition: "décider sans la personne qui devra accepter", type: "expression" },
  { terme: "sbarcare il lunario", definition: "joindre les deux bouts", type: "expression" },
  { terme: "perdere la camicia", definition: "tout perdre dans une affaire", type: "expression" },
  { terme: "non avere il becco di un quattrino", definition: "ne pas avoir un sou", type: "expression" },
  { terme: "piangere miseria", definition: "se dire sans le sou, parfois sans raison", type: "expression" },
  { terme: "fare cassa", definition: "récupérer de l'argent rapidement", type: "expression" },
  { terme: "essere in rosso", definition: "être à découvert", type: "expression" },
  { terme: "pagare alla romana", definition: "partager l'addition en parts égales", type: "expression" },
  { terme: "campare di rendita", definition: "vivre de revenus sans travailler", type: "expression" },
  { terme: "fare il passo più lungo della gamba", definition: "entreprendre au-dessus de ses moyens", type: "expression" },
  { terme: "per quattro soldi", definition: "pour une somme dérisoire", type: "expression" },
  { terme: "il tempo è denaro", definition: "le temps a une valeur qu'on peut compter", type: "expression" },
  { terme: "avere il braccino corto", definition: "être trop avare pour dépenser", type: "expression" },
  { terme: "i soldi non hanno odore", definition: "accepter l'argent quelle qu'en soit l'origine", type: "expression" },
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
