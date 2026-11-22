/**
 * Pack 13 — Argent & économie (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el dinero", definition: "argent", type: "" },
  { terme: "el banco", definition: "banque", type: "" },
  { terme: "la cuenta bancaria", definition: "compte bancaire", type: "" },
  { terme: "la tarjeta bancaria", definition: "carte bancaire", type: "" },
  { terme: "el cajero", definition: "caissier, caissière", type: "" },
  { terme: "el préstamo", definition: "prêt", type: "" },
  { terme: "el crédito", definition: "crédit", type: "" },
  { terme: "la hipoteca", definition: "hypothèque", type: "" },
  { terme: "el interés", definition: "intérêt", type: "" },
  { terme: "el presupuesto", definition: "budget", type: "" },
  { terme: "el gasto", definition: "dépense", type: "" },
  { terme: "el ingreso", definition: "revenu", type: "" },
  { terme: "el ahorro", definition: "épargne", type: "" },
  { terme: "la inflación", definition: "inflation", type: "" },
  { terme: "el paro", definition: "chômage", type: "" },
  { terme: "el euro", definition: "euro", type: "" },
  { terme: "el céntimo", definition: "centime", type: "" },
  { terme: "la moneda", definition: "pièce de monnaie", type: "" },
  { terme: "el billete de banco", definition: "billet de banque", type: "" },
  { terme: "el cambio", definition: "monnaie rendue", type: "" },
  { terme: "caro", definition: "cher", type: "" },
  { terme: "barato", definition: "bon marché", type: "" },
  { terme: "gratis", definition: "gratuit", type: "" },
  { terme: "el descuento", definition: "réduction de prix", type: "" },
  { terme: "el recibo", definition: "reçu", type: "" },
  { terme: "el precio", definition: "prix", type: "" },
  { terme: "la oferta comercial", definition: "offre commerciale", type: "" },
  { terme: "la demanda", definition: "demande", type: "" },
  { terme: "la bolsa", definition: "bourse", type: "" },
  { terme: "el consumidor", definition: "consommateur", type: "" },
  { terme: "el cliente", definition: "client", type: "" },
  { terme: "la tienda", definition: "magasin", type: "" },
  { terme: "el comercio", definition: "commerce", type: "" },
  { terme: "la empresa", definition: "entreprise", type: "" },
  { terme: "el beneficio", definition: "bénéfice", type: "" },
  { terme: "la pérdida", definition: "perte financière", type: "" },
  { terme: "la inversión", definition: "investissement", type: "" },
  { terme: "el accionista", definition: "actionnaire", type: "" },
  { terme: "la acción bursátil", definition: "action en bourse", type: "" },
  { terme: "el dividendo", definition: "dividende", type: "" },
  { terme: "la deuda pública", definition: "dette publique", type: "" },
  { terme: "el déficit", definition: "déficit", type: "" },
  { terme: "el superávit", definition: "excédent", type: "" },
  { terme: "el IRPF", definition: "impôt sur le revenu en Espagne", type: "" },
  { terme: "la Hacienda", definition: "fisc", type: "" },
  { terme: "el IVA", definition: "TVA", type: "" },
  { terme: "la declaración de la renta", definition: "déclaration de revenus", type: "" },
  { terme: "el seguro", definition: "assurance", type: "" },
  { terme: "la prima del seguro", definition: "prime d'assurance", type: "" },
  { terme: "el fraude", definition: "fraude", type: "" },
  { terme: "la firma", definition: "signature, ou entreprise", type: "" },
  { terme: "el cajero automático", definition: "guichet automatique", type: "" },
  { terme: "la transferencia", definition: "virement", type: "" },
  { terme: "el descubierto", definition: "découvert bancaire", type: "" },
  { terme: "la cuota", definition: "mensualité", type: "" },
  { terme: "el alquiler financiero", definition: "crédit-bail", type: "" },
  { terme: "la caja", definition: "caisse", type: "" },
  { terme: "el monedero", definition: "porte-monnaie", type: "" },
  { terme: "la hucha", definition: "tirelire", type: "" },
  { terme: "el sueldo neto", definition: "salaire net", type: "" },
  { terme: "el coste de la vida", definition: "coût de la vie", type: "" },
  { terme: "la competencia", definition: "concurrence", type: "" },
  { terme: "el crecimiento", definition: "croissance économique", type: "" },
  { terme: "la crisis", definition: "crise économique", type: "" },
  { terme: "el cheque", definition: "chèque", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "ahorrar", definition: "économiser de l'argent", type: "" },
  { terme: "gastar", definition: "dépenser", type: "" },
  { terme: "pagar", definition: "payer", type: "" },
  { terme: "cobrar", definition: "encaisser", type: "" },
  { terme: "prestar", definition: "prêter", type: "" },
  { terme: "invertir", definition: "investir de l'argent", type: "" },
  { terme: "ingresar", definition: "déposer de l'argent sur un compte", type: "" },
  { terme: "retirar", definition: "retirer de l'argent", type: "" },
  { terme: "transferir", definition: "virer une somme", type: "" },
  { terme: "firmar", definition: "signer", type: "" },
  { terme: "endeudarse", definition: "s'endetter", type: "" },
  { terme: "regatear el precio", definition: "marchander un prix", type: "" },
  { terme: "reembolsar", definition: "rembourser", type: "" },
  { terme: "financiar", definition: "financer", type: "" },
  { terme: "deber", definition: "devoir de l'argent", type: "" },
  // —— 20 expressions ——
  { terme: "costar un ojo de la cara", definition: "coûter les yeux de la tête", type: "expression" },
  { terme: "no tener donde caerse muerto", definition: "être sans un sou", type: "expression" },
  { terme: "nadar en la abundancia", definition: "rouler sur l'or", type: "expression" },
  { terme: "rascarse el bolsillo", definition: "mettre la main à la poche", type: "expression" },
  { terme: "hacer el agosto", definition: "faire son beurre", type: "expression" },
  { terme: "no valer un pimiento", definition: "ne rien valoir", type: "expression" },
  { terme: "ser un pozo sin fondo", definition: "être un gouffre", type: "expression" },
  { terme: "apretarse el cinturón", definition: "se serrer la ceinture", type: "expression" },
  { terme: "tirar la casa por la ventana", definition: "dépenser sans compter", type: "expression" },
  { terme: "sin soltar un duro", definition: "sans débourser un centime", type: "expression" },
  { terme: "tener el riñón bien cubierto", definition: "avoir les reins solides", type: "expression" },
  { terme: "quedarse a dos velas", definition: "se retrouver fauché", type: "expression" },
  { terme: "no es oro todo lo que reluce", definition: "ne pas se fier aux apparences", type: "expression" },
  { terme: "pan para hoy y hambre para mañana", definition: "sacrifier demain pour aujourd'hui", type: "expression" },
  { terme: "en números rojos", definition: "être dans le rouge", type: "expression" },
  { terme: "a escote", definition: "en partageant l'addition", type: "expression" },
  { terme: "pagar los platos rotos", definition: "écoper des dégâts", type: "expression" },
  { terme: "el dinero no da la felicidad", definition: "ne pas acheter le bonheur", type: "expression" },
  { terme: "sacar las castañas del fuego", definition: "tirer les marrons du feu", type: "expression" },
  { terme: "por la patilla", definition: "sans rien payer", type: "expression" },
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
