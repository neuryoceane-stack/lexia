/**
 * Pack 4 — Médias & réseaux sociaux (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el informativo", definition: "journal télévisé", type: "" },
  { terme: "la prensa", definition: "presse", type: "" },
  { terme: "la publicación", definition: "publication sur un réseau", type: "" },
  { terme: "el me gusta", definition: "marque d'approbation en ligne", type: "" },
  { terme: "el comentario", definition: "commentaire", type: "" },
  { terme: "el vídeo", definition: "vidéo", type: "" },
  { terme: "la foto", definition: "photo", type: "" },
  { terme: "el blog", definition: "blog", type: "" },
  { terme: "el feed", definition: "fil d'actualité", type: "" },
  { terme: "la cuenta de usuario", definition: "compte d'utilisateur", type: "" },
  { terme: "la contraseña", definition: "mot de passe", type: "" },
  { terme: "el canal", definition: "chaîne", type: "" },
  { terme: "el espectador", definition: "téléspectateur", type: "" },
  { terme: "el lector", definition: "lecteur", type: "" },
  { terme: "el redactor", definition: "rédacteur", type: "" },
  { terme: "el titular", definition: "manchette", type: "" },
  { terme: "el artículo", definition: "article", type: "" },
  { terme: "el rumor", definition: "rumeur", type: "" },
  { terme: "el cotilleo", definition: "potins", type: "" },
  { terme: "la retransmisión en directo", definition: "diffusion en direct", type: "" },
  { terme: "la tendencia", definition: "tendance", type: "" },
  { terme: "el meme", definition: "mème", type: "" },
  { terme: "el hashtag", definition: "mot-dièse", type: "" },
  { terme: "el suscriptor", definition: "abonné", type: "" },
  { terme: "la descarga", definition: "téléchargement", type: "" },
  { terme: "la suscripción", definition: "abonnement", type: "" },
  { terme: "el pódcast", definition: "podcast", type: "" },
  { terme: "el destripe", definition: "révélation anticipée de l'intrigue", type: "" },
  { terme: "el trol", definition: "provocateur en ligne", type: "" },
  { terme: "la moderación", definition: "filtrage des commentaires", type: "" },
  { terme: "la plataforma", definition: "plateforme", type: "" },
  { terme: "viral", definition: "à diffusion très rapide en ligne", type: "" },
  { terme: "el influencer", definition: "influenceur, influenceuse", type: "" },
  { terme: "el algoritmo", definition: "algorithme", type: "" },
  { terme: "la noticia falsa", definition: "fausse actu", type: "" },
  { terme: "la noticia de última hora", definition: "information de dernière minute", type: "" },
  { terme: "el comunicado de prensa", definition: "communiqué de presse", type: "" },
  { terme: "la emisión", definition: "diffusion à l'antenne", type: "" },
  { terme: "el documental", definition: "documentaire", type: "" },
  { terme: "la censura", definition: "censure", type: "" },
  { terme: "el denunciante", definition: "lanceur d'alerte", type: "" },
  { terme: "la desinformación", definition: "désinformation", type: "" },
  { terme: "la cámara de eco", definition: "chambre d'écho", type: "" },
  { terme: "el ciberacoso", definition: "cyberharcèlement", type: "" },
  { terme: "los ajustes de privacidad", definition: "réglages de confidentialité", type: "" },
  { terme: "la filtración de datos", definition: "fuite de données", type: "" },
  { terme: "el phishing", definition: "hameçonnage", type: "" },
  { terme: "el tiempo de pantalla", definition: "temps passé devant les écrans", type: "" },
  { terme: "el atracón de series", definition: "visionnage de nombreux épisodes d'affilée", type: "" },
  { terme: "la notificación", definition: "notification", type: "" },
  { terme: "el titular cebo", definition: "titre conçu pour forcer le clic", type: "" },
  { terme: "el muro de pago", definition: "accès réservé aux abonnés payants", type: "" },
  { terme: "el boletín", definition: "lettre d'information", type: "" },
  { terme: "la verificación de datos", definition: "vérification des faits", type: "" },
  { terme: "el pie de foto", definition: "légende sous une image", type: "" },
  { terme: "los subtítulos", definition: "sous-titres", type: "" },
  { terme: "el anuncio", definition: "spot publicitaire", type: "" },
  { terme: "el alcance", definition: "portée d'un contenu", type: "" },
  { terme: "la fuente citada", definition: "source citée d'une information", type: "" },
  { terme: "la libertad de prensa", definition: "liberté de la presse", type: "" },
  { terme: "actual", definition: "actuel", type: "" },
  { terme: "el título", definition: "titre d'un article", type: "" },
  { terme: "el minuto a minuto", definition: "suivi minute par minute d'un événement", type: "" },
  { terme: "los medios de comunicación", definition: "médias", type: "" },
  { terme: "el chat", definition: "discussion instantanée en ligne", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "iniciar sesión", definition: "se connecter à un compte", type: "" },
  { terme: "cerrar sesión", definition: "se déconnecter", type: "" },
  { terme: "colgar", definition: "mettre un contenu en ligne", type: "" },
  { terme: "descargar", definition: "télécharger", type: "" },
  { terme: "deslizar", definition: "faire défiler un écran", type: "" },
  { terme: "sintonizar", definition: "régler un poste sur une chaîne", type: "" },
  { terme: "silenciar", definition: "couper le son ou les messages de quelqu'un", type: "" },
  { terme: "ocultar", definition: "masquer un élément", type: "" },
  { terme: "contrastar", definition: "vérifier une information en comparant les sources", type: "" },
  { terme: "reenviar", definition: "transférer un message", type: "" },
  { terme: "destapar", definition: "révéler une affaire cachée", type: "" },
  { terme: "asistir", definition: "assister à", type: "" },
  { terme: "quitar hierro", definition: "présenter un fait comme moins grave", type: "" },
  { terme: "exagerar", definition: "grossir un événement", type: "" },
  { terme: "darse de baja", definition: "se désinscrire d'un service", type: "" },
  // —— 20 expressions ——
  { terme: "correr como la pólvora", definition: "se répandre à toute vitesse", type: "expression" },
  { terme: "descubrir el pastel", definition: "révéler un secret", type: "expression" },
  { terme: "estar en el candelero", definition: "être au centre de l'attention", type: "expression" },
  { terme: "leer entre líneas", definition: "comprendre le non-dit", type: "expression" },
  { terme: "de boca en boca", definition: "circuler par le bouche-à-oreille", type: "expression" },
  { terme: "ser un secreto a voces", definition: "être connu de tous sans être officiel", type: "expression" },
  { terme: "saltar a la portada", definition: "faire la une", type: "expression" },
  { terme: "predicar en el desierto", definition: "parler sans être entendu", type: "expression" },
  { terme: "decirlo por lo bajo", definition: "le dire à mi-voix", type: "expression" },
  { terme: "no tener pelos en la lengua", definition: "parler sans détour", type: "expression" },
  { terme: "dorar la píldora", definition: "enjoliver une mauvaise nouvelle", type: "expression" },
  { terme: "estar en boca de todos", definition: "être le sujet de toutes les conversations", type: "expression" },
  { terme: "echar las campanas al vuelo", definition: "se réjouir publiquement, souvent trop tôt", type: "expression" },
  { terme: "ser papel mojado", definition: "rester sans effet", type: "expression" },
  { terme: "estar al tanto", definition: "être au courant", type: "expression" },
  { terme: "perder el hilo", definition: "perdre le fil", type: "expression" },
  { terme: "hacer una montaña de un grano de arena", definition: "donner à un détail une importance démesurée", type: "expression" },
  { terme: "caer como una bomba", definition: "produire un effet retentissant", type: "expression" },
  { terme: "mucho ruido y pocas nueces", definition: "beaucoup de bruit pour peu de résultat", type: "expression" },
  { terme: "dar la lata", definition: "importuner de façon répétée", type: "expression" },
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
