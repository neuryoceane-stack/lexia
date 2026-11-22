/**
 * Pack 4 — Médias & réseaux sociaux (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "news", definition: "nouvelles", type: "" },
  { terme: "press", definition: "presse", type: "" },
  { terme: "post", definition: "publication", type: "" },
  { terme: "share", definition: "partager", type: "" },
  { terme: "like", definition: "j'aime", type: "" },
  { terme: "comment", definition: "commentaire", type: "" },
  { terme: "video", definition: "vidéo", type: "" },
  { terme: "photo", definition: "photo", type: "" },
  { terme: "blog", definition: "blog", type: "" },
  { terme: "feed", definition: "fil d'actualité", type: "" },
  { terme: "user", definition: "utilisateur", type: "" },
  { terme: "account", definition: "compte", type: "" },
  { terme: "password", definition: "mot de passe", type: "" },
  { terme: "channel", definition: "chaîne", type: "" },
  { terme: "viewer", definition: "téléspectateur", type: "" },
  { terme: "reader", definition: "lecteur", type: "" },
  { terme: "editor", definition: "rédacteur", type: "" },
  { terme: "headline", definition: "titre (presse)", type: "" },
  { terme: "article", definition: "article", type: "" },
  { terme: "rumour", definition: "rumeur", type: "" },
  { terme: "gossip", definition: "potins", type: "" },
  { terme: "stream", definition: "diffusion en direct", type: "" },
  { terme: "trend", definition: "tendance", type: "" },
  { terme: "meme", definition: "mème", type: "" },
  { terme: "hashtag", definition: "mot-dièse", type: "" },
  { terme: "follower", definition: "abonné", type: "" },
  { terme: "upload", definition: "mettre en ligne", type: "" },
  { terme: "download", definition: "télécharger", type: "" },
  { terme: "subscribe", definition: "s'abonner", type: "" },
  { terme: "podcast", definition: "balado / podcast", type: "" },
  { terme: "spoiler", definition: "révélation qui gâche l'intrigue", type: "" },
  { terme: "troll", definition: "provocateur en ligne", type: "" },
  { terme: "moderator", definition: "modérateur", type: "" },
  { terme: "platform", definition: "plateforme", type: "" },
  { terme: "viral", definition: "viral", type: "" },
  { terme: "influencer", definition: "influenceur", type: "" },
  { terme: "algorithm", definition: "algorithme", type: "" },
  { terme: "fake news", definition: "fausses informations", type: "" },
  { terme: "breaking news", definition: "dernière minute", type: "" },
  { terme: "press release", definition: "communiqué de presse", type: "" },
  { terme: "broadcast", definition: "diffusion", type: "" },
  { terme: "documentary", definition: "documentaire", type: "" },
  { terme: "censorship", definition: "censure", type: "" },
  { terme: "whistleblower", definition: "lanceur d'alerte", type: "" },
  { terme: "misinformation", definition: "désinformation", type: "" },
  { terme: "echo chamber", definition: "chambre d'écho", type: "" },
  { terme: "cyberbullying", definition: "cyberharcèlement", type: "" },
  { terme: "privacy settings", definition: "paramètres de confidentialité", type: "" },
  { terme: "data breach", definition: "fuite de données", type: "" },
  { terme: "phishing", definition: "hameçonnage", type: "" },
  { terme: "digital detox", definition: "détox numérique", type: "" },
  { terme: "binge-watch", definition: "regarder en rafale", type: "" },
  { terme: "scroll", definition: "faire défiler", type: "" },
  { terme: "notification", definition: "notification", type: "" },
  { terme: "clickbait", definition: "titre racoleur", type: "" },
  { terme: "paywall", definition: "mur payant", type: "" },
  { terme: "newsletter", definition: "infolettre", type: "" },
  { terme: "livestream", definition: "direct en ligne", type: "" },
  { terme: "fact-check", definition: "vérification des faits", type: "" },
  { terme: "caption", definition: "légende", type: "" },
  { terme: "repost", definition: "repartager", type: "" },
  { terme: "tweet", definition: "publier sur X / Twitter", type: "" },
  { terme: "link", definition: "lien", type: "" },
  { terme: "clip", definition: "extrait vidéo", type: "" },
  { terme: "ad", definition: "publicité", type: "" },
  { terme: "log in", definition: "se connecter", type: "" },
  { terme: "log out", definition: "se déconnecter", type: "" },
  { terme: "sign up", definition: "créer un compte", type: "" },
  { terme: "scroll through", definition: "faire défiler", type: "" },
  { terme: "speak out", definition: "prendre la parole", type: "" },
  { terme: "tune in", definition: "syntoniser / regarder", type: "" },
  { terme: "tune out", definition: "ne plus écouter", type: "" },
  { terme: "go viral", definition: "devenir viral", type: "" },
  { terme: "shut down", definition: "couper (un compte)", type: "" },
  { terme: "chime in", definition: "intervenir", type: "" },
  { terme: "play down", definition: "minimiser", type: "" },
  { terme: "play up", definition: "exagérer", type: "" },
  { terme: "sound off", definition: "donner son avis", type: "" },
  { terme: "bring up", definition: "évoquer", type: "" },
  { terme: "opt out", definition: "se désinscrire", type: "" },
  { terme: "spread like wildfire", definition: "se répandre comme une traînée de poudre", type: "expression" },
  { terme: "break the news", definition: "annoncer la nouvelle", type: "expression" },
  { terme: "in the spotlight", definition: "sous les projecteurs", type: "expression" },
  { terme: "read between the lines", definition: "lire entre les lignes", type: "expression" },
  { terme: "word of mouth", definition: "bouche à oreille", type: "expression" },
  { terme: "hot off the press", definition: "tout juste sorti", type: "expression" },
  { terme: "front page", definition: "une (de journal)", type: "expression" },
  { terme: "stay tuned", definition: "restez à l'écoute", type: "expression" },
  { terme: "on air", definition: "à l'antenne", type: "expression" },
  { terme: "off the record", definition: "hors micro / sans attribution", type: "expression" },
  { terme: "hit the headlines", definition: "faire la une", type: "expression" },
  { terme: "a soap opera", definition: "un feuilleton", type: "expression" },
  { terme: "ratings war", definition: "guerre d'audience", type: "expression" },
  { terme: "freedom of the press", definition: "liberté de la presse", type: "expression" },
  { terme: "slip of the tongue", definition: "lapsus", type: "expression" },
  { terme: "the talk of the town", definition: "sujet de conversation en ville", type: "expression" },
  { terme: "media frenzy", definition: "frénésie médiatique", type: "expression" },
  { terme: "under the radar", definition: "discret, peu visible", type: "expression" },
  { terme: "in the loop", definition: "tenu au courant", type: "expression" },
  { terme: "out of touch", definition: "déconnecté de la réalité", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-04-medias-reseaux.xlsx"));