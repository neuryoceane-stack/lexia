/**
 * Compression d'image côté client avant envoi à l'OCR.
 *
 * Objectif : réduire le poids des photos (et donc le temps d'upload + d'analyse
 * par Claude) sans perte de lisibilité notable pour de la reconnaissance de texte.
 *
 * Garde-fou : cette fonction ne lève JAMAIS d'erreur. En cas de souci (canvas
 * indisponible, toBlob null, format non décodable) ou si la compression produit
 * un fichier plus lourd que l'original, on renvoie le fichier ORIGINAL inchangé.
 * Aucun import ne doit pouvoir être bloqué par la compression.
 */

/** Plus grande dimension autorisée (px). Aligné sur la limite recommandée de Claude Vision. */
const MAX_DIMENSION = 1568;
/** Qualité JPEG de ré-encodage. */
const JPEG_QUALITY = 0.85;

type Dimensions = { width: number; height: number };

/** Calcule les dimensions cibles en conservant le ratio, sans agrandir. */
function computeTargetSize(width: number, height: number): Dimensions {
  const largest = Math.max(width, height);
  if (largest <= MAX_DIMENSION) return { width, height };
  const scale = MAX_DIMENSION / largest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Charge une image décodée, en privilégiant createImageBitmap (rapide, gère
 * l'orientation EXIF). Fallback sur HTMLImageElement + object URL.
 * Renvoie aussi un éventuel cleanup à appeler après usage.
 */
async function loadDrawable(
  file: File
): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Échec du décodage de l'image"));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Compresse une image (redimensionnement + ré-encodage JPEG qualité 0.85).
 * Retourne un nouveau File image/jpeg, ou le fichier original si la compression
 * échoue ou n'apporte aucun gain de poids. Ne traite que les fichiers image/*.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (typeof document === "undefined") return file;

  let drawable: Awaited<ReturnType<typeof loadDrawable>> | null = null;
  try {
    drawable = await loadDrawable(file);
    const { source, width, height } = drawable;
    if (!width || !height) return file;

    const target = computeTargetSize(width, height);

    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(source, 0, 0, target.width, target.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    // Si le résultat n'est pas plus léger, on garde l'original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    drawable?.cleanup();
  }
}
