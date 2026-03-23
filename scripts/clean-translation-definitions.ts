/**
 * Nettoie les définitions de mots :
 * - JSON / markdown Claude → champ `translation` uniquement
 * - Préfixe « terme : traduction » quand le terme à gauche du « : » = mot (liste)
 *
 * Usage (depuis le dossier projet-vocab) :
 *   npm run db:clean-definitions
 *
 * `.env.local` est chargé avant l’initialisation de la BDD (imports dynamiques).
 */
import { config } from "dotenv";
import { resolve } from "path";
import {
  parseClaudeTranslationResponse,
  stripLeadingTermColonTranslation,
} from "../src/lib/parse-claude-translation";

config({ path: resolve(process.cwd(), ".env.local") });

/** Applique parse JSON puis retrait « terme : » si pertinent. */
function resolveCleanDefinition(
  term: string,
  definition: string
): string | null {
  const raw = definition.trim();
  if (!raw) return null;

  let d = raw;

  const jsonish =
    d.includes("```") ||
    (d.startsWith("{") && d.includes('"translation"'));
  if (jsonish) {
    const { translation } = parseClaudeTranslationResponse(d);
    const parsed = translation.trim();
    if (parsed.length > 0) {
      d = parsed;
    }
  }

  const afterColon = stripLeadingTermColonTranslation(term, d);
  if (afterColon) {
    d = afterColon;
  }

  if (d === raw) return null;
  if (d.includes("```") && d.length > 120) return null;

  return d;
}

async function main() {
  const { and, eq, like, or } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db");
  const { words } = await import("../src/lib/db/schema");

  const rows = await db
    .select()
    .from(words)
    .where(
      or(
        like(words.definition, "%```%"),
        and(
          like(words.definition, "{%"),
          like(words.definition, '%"translation"%')
        ),
        like(words.definition, "% : %")
      )
    );

  let updated = 0;
  for (const w of rows) {
    const clean = resolveCleanDefinition(String(w.term), w.definition);
    if (!clean) continue;

    await db.update(words).set({ definition: clean }).where(eq(words.id, w.id));
    updated += 1;
    console.log(
      "OK",
      w.id,
      String(w.term).slice(0, 40),
      "→",
      clean.slice(0, 80) + (clean.length > 80 ? "…" : "")
    );
  }

  console.log(
    `Terminé : ${updated} mot(s) mis à jour sur ${rows.length} ligne(s) candidate(s).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
