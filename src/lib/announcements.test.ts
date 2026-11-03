import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";
import { ANNOUNCEMENT_SCHEMA_SQL, ANNOUNCEMENT_SCHEMA_STATEMENTS } from "./announcements-sql";
import {
  ANNOUNCEMENT_MESSAGE_MAX,
  ANNOUNCEMENT_NOT_DISMISSIBLE,
  AnnouncementError,
  announcementMessageLength,
  clampAnnouncementMessage,
  formatParisInput,
  isAnnouncementUniqueConflict,
  isMissingAnnouncementTable,
  messageCounterLabel,
  parseAnnouncementDraft,
  parseAnnouncementList,
  parseParisDateTime,
  pickActiveAnnouncement,
  safeAnnouncementLink,
  toAnnouncementListItem,
  type AnnouncementRecord,
} from "./announcements";
import {
  deleteAnnouncement,
  dismissAnnouncement,
  insertAnnouncement,
  listAnnouncements,
  loadStudentBanner,
  updateAnnouncement,
} from "./announcements-store";

const NOW = new Date("2026-11-02T12:00:00.000Z");

function record(
  partial: Partial<AnnouncementRecord> & Pick<AnnouncementRecord, "id" | "type" | "createdAt">,
): AnnouncementRecord {
  return {
    linkLabel: null,
    linkUrl: null,
    audience: "all",
    languageCode: null,
    startsAt: null,
    endsAt: null,
    dismissible: true,
    status: "published",
    ...partial,
    message: partial.message ?? partial.id,
  };
}

function openDatabase() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec("CREATE TABLE users (id TEXT PRIMARY KEY NOT NULL)");
  for (const statement of ANNOUNCEMENT_SCHEMA_STATEMENTS) sqlite.exec(statement);
  for (const statement of ANNOUNCEMENT_SCHEMA_STATEMENTS) sqlite.exec(statement);
  sqlite.prepare("INSERT INTO users (id) VALUES (?)").run("eleve-1");
  return drizzle(sqlite, { schema });
}

describe("safeAnnouncementLink", () => {
  it("accepte un chemin interne et une adresse https", () => {
    assert.equal(safeAnnouncementLink("/app"), "/app");
    assert.equal(safeAnnouncementLink("/app/revision?listIds=1"), "/app/revision?listIds=1");
    assert.equal(safeAnnouncementLink("  https://lexiva.example/aide  "), "https://lexiva.example/aide");
  });

  it("refuse les autres schémas et les chemins qui sortent de l'app", () => {
    assert.equal(safeAnnouncementLink("javascript:alert(1)"), null);
    assert.equal(safeAnnouncementLink("data:text/html,hi"), null);
    assert.equal(safeAnnouncementLink("http://lexiva.example"), null);
    assert.equal(safeAnnouncementLink("//lexiva.example"), null);
    assert.equal(safeAnnouncementLink("/login"), null);
    assert.equal(safeAnnouncementLink("/app/../login"), null);
    assert.equal(safeAnnouncementLink("/app/%2e%2e/login"), null);
    assert.equal(safeAnnouncementLink("https://user:pass@lexiva.example"), null);
    assert.equal(safeAnnouncementLink("/app/revision\n"), null);
  });
});

describe("parseAnnouncementDraft", () => {
  const valid = {
    type: "news",
    message: "Les listes s'ouvrent plus vite.",
    linkLabel: "",
    linkUrl: "",
    audience: "all",
    languageCode: null,
    startsAt: "",
    endsAt: "",
    dismissible: true,
    status: "published",
  };

  it("accepte un brouillon sans lien et borne le message à 140 caractères", () => {
    const parsed = parseAnnouncementDraft({ ...valid, status: "draft" }, NOW);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.draft.linkUrl, null);
    assert.equal(parsed.draft.message, "Les listes s'ouvrent plus vite.");

    const tooLong = parseAnnouncementDraft({ ...valid, message: "a".repeat(141) }, NOW);
    assert.equal(tooLong.ok, false);
    assert.equal(announcementMessageLength("é".repeat(140)), 140);
    assert.equal(clampAnnouncementMessage("a".repeat(200)).length, ANNOUNCEMENT_MESSAGE_MAX);
    assert.equal(messageCounterLabel(1), "1 caractère sur 140");
    assert.equal(messageCounterLabel(2), "2 caractères sur 140");
  });

  it("exige la langue, le couple de lien, et une fin postérieure au début", () => {
    const missingLanguage = parseAnnouncementDraft({ ...valid, audience: "language", languageCode: "" }, NOW);
    assert.equal(missingLanguage.ok, false);

    const unknownLanguage = parseAnnouncementDraft({ ...valid, audience: "language", languageCode: "zzz" }, NOW);
    assert.equal(unknownLanguage.ok, false);

    const halfLink = parseAnnouncementDraft({ ...valid, linkLabel: "Voir", linkUrl: "" }, NOW);
    assert.equal(halfLink.ok, false);

    const badScheme = parseAnnouncementDraft({ ...valid, linkLabel: "Voir", linkUrl: "javascript:alert(1)" }, NOW);
    assert.equal(badScheme.ok, false);

    const order = parseAnnouncementDraft(
      { ...valid, startsAt: "2026-11-03T10:00", endsAt: "2026-11-02T10:00" },
      NOW,
    );
    assert.equal(order.ok, false);

    const ended = parseAnnouncementDraft({ ...valid, endsAt: "2026-11-01T10:00", status: "published" }, NOW);
    assert.equal(ended.ok, false);

    const draftEnded = parseAnnouncementDraft({ ...valid, endsAt: "2026-11-01T10:00", status: "draft" }, NOW);
    assert.equal(draftEnded.ok, true);
  });

  it("lit l'heure de Paris et ignore la langue hors de ce public", () => {
    const parsed = parseAnnouncementDraft(
      {
        ...valid,
        audience: "all",
        languageCode: "eng",
        startsAt: "2026-11-02T21:00",
        linkLabel: "Ouvrir",
        linkUrl: "/app/familles",
      },
      NOW,
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.draft.languageCode, null);
    assert.equal(parsed.draft.linkUrl, "/app/familles");
    assert.equal(parsed.draft.startsAt?.toISOString(), "2026-11-02T20:00:00.000Z");
  });
});

describe("heure de Paris", () => {
  it("convertit 21:00 en hiver et refuse l'heure qui n'existe pas", () => {
    const winter = parseParisDateTime("2026-11-02T21:00");
    assert.equal(winter?.toISOString(), "2026-11-02T20:00:00.000Z");
    assert.equal(winter ? formatParisInput(winter) : null, "2026-11-02T21:00");
    assert.equal(parseParisDateTime("2026-03-29T02:30"), null);
    assert.equal(parseParisDateTime("2026-02-31T10:00"), null);
  });
});

describe("pickActiveAnnouncement", () => {
  const student = { subscriptionStatus: "active", languageCodes: ["eng"] };

  it("choisit Important, puis la plus récente", () => {
    const picked = pickActiveAnnouncement(
      [
        record({ id: "news", type: "news", createdAt: new Date("2026-11-02T11:00:00.000Z") }),
        record({ id: "old", type: "important", createdAt: new Date("2026-11-01T11:00:00.000Z") }),
        record({ id: "info", type: "info", createdAt: new Date("2026-11-02T11:30:00.000Z") }),
      ],
      student,
      NOW,
    );
    assert.equal(picked?.id, "old");

    const newest = pickActiveAnnouncement(
      [
        record({ id: "old", type: "important", createdAt: new Date("2026-11-01T11:00:00.000Z") }),
        record({ id: "new", type: "important", createdAt: new Date("2026-11-02T11:00:00.000Z") }),
      ],
      student,
      NOW,
    );
    assert.equal(newest?.id, "new");
  });

  it("respecte le public, les dates et le brouillon", () => {
    const rows = [
      record({ id: "all", type: "info", createdAt: new Date("2026-11-02T08:00:00.000Z") }),
      record({
        id: "trial",
        type: "important",
        audience: "trial",
        createdAt: new Date("2026-11-02T09:00:00.000Z"),
      }),
      record({
        id: "english",
        type: "news",
        audience: "language",
        languageCode: "eng",
        createdAt: new Date("2026-11-02T10:00:00.000Z"),
      }),
      record({
        id: "spanish",
        type: "important",
        audience: "language",
        languageCode: "spa",
        createdAt: new Date("2026-11-02T11:00:00.000Z"),
      }),
      record({
        id: "future",
        type: "important",
        startsAt: new Date("2026-11-03T00:00:00.000Z"),
        createdAt: new Date("2026-11-02T11:00:00.000Z"),
      }),
      record({
        id: "past",
        type: "important",
        endsAt: new Date("2026-11-02T11:00:00.000Z"),
        createdAt: new Date("2026-11-02T11:00:00.000Z"),
      }),
      record({ id: "draft", type: "important", status: "draft", createdAt: new Date("2026-11-02T11:00:00.000Z") }),
    ];

    assert.equal(pickActiveAnnouncement(rows, student, NOW)?.id, "english");
    assert.equal(
      pickActiveAnnouncement(rows, { subscriptionStatus: "trialing", languageCodes: [] }, NOW)?.id,
      "trial",
    );
    assert.equal(
      pickActiveAnnouncement(rows, { subscriptionStatus: "inactive", languageCodes: [] }, NOW)?.id,
      "all",
    );
    assert.equal(
      pickActiveAnnouncement(rows, { subscriptionStatus: "active", languageCodes: ["ENG"] }, NOW)?.id,
      "english",
    );
  });
});

describe("erreurs de base", () => {
  it("reconnaît une table absente et le conflit de fermeture", () => {
    const missing = new Error("Failed query");
    missing.cause = new Error("SQLITE_ERROR: no such table: announcements");
    assert.equal(isMissingAnnouncementTable(missing), true);
    assert.equal(isMissingAnnouncementTable(new Error("no such table: announcement_dismissals")), true);
    assert.equal(isMissingAnnouncementTable(new Error("no such table: users")), false);

    const unique = new Error(
      "UNIQUE constraint failed: announcement_dismissals.announcement_id, announcement_dismissals.user_id",
    );
    assert.equal(isAnnouncementUniqueConflict(unique), true);
    assert.equal(isAnnouncementUniqueConflict(new Error("UNIQUE constraint failed: users.email")), false);
  });
});

describe("schéma et sélection en base", () => {
  it("crée les tables, choisit la bannière et retient la fermeture", async () => {
    assert.match(ANNOUNCEMENT_SCHEMA_SQL, /CREATE TABLE IF NOT EXISTS announcements/);
    assert.match(
      ANNOUNCEMENT_SCHEMA_SQL,
      /CREATE UNIQUE INDEX IF NOT EXISTS announcement_dismissals_announcement_user_unique/,
    );

    const database = openDatabase();
    await database.insert(schema.announcements).values({
      id: "important",
      type: "important",
      message: "Maintenance ce soir.",
      audience: "subscribers",
      dismissible: false,
      status: "published",
      createdAt: new Date("2026-11-01T08:00:00.000Z"),
    });
    await database.insert(schema.announcements).values({
      id: "news",
      type: "news",
      message: "Nouveau filtre.",
      linkLabel: "Voir",
      linkUrl: "javascript:alert(1)",
      audience: "all",
      dismissible: true,
      status: "published",
      createdAt: new Date("2026-11-02T08:00:00.000Z"),
    });
    await database.insert(schema.announcements).values({
      id: "draft",
      type: "info",
      message: "Pas encore.",
      audience: "all",
      dismissible: true,
      status: "draft",
      createdAt: new Date("2026-11-02T09:00:00.000Z"),
    });

    const active = { subscriptionStatus: "active", languageCodes: ["eng"] };
    const first = await loadStudentBanner(database, "eleve-1", active, NOW);
    assert.equal(first?.id, "important");
    assert.equal(first?.dismissible, false);
    await assert.rejects(
      () => dismissAnnouncement(database, "eleve-1", "important", active, NOW),
      (error: unknown) => error instanceof AnnouncementError && error.message === ANNOUNCEMENT_NOT_DISMISSIBLE,
    );

    const inactive = { subscriptionStatus: "inactive", languageCodes: [] };
    const news = await loadStudentBanner(database, "eleve-1", inactive, NOW);
    assert.equal(news?.id, "news");
    assert.equal(news?.linkUrl, null);

    await dismissAnnouncement(database, "eleve-1", "news", inactive, NOW);
    await dismissAnnouncement(database, "eleve-1", "news", inactive, NOW);
    assert.equal(await loadStudentBanner(database, "eleve-1", inactive, NOW), null);

    const [stored] = await database
      .select({ dismissible: schema.announcements.dismissible })
      .from(schema.announcements)
      .where(eq(schema.announcements.id, "important"));
    assert.equal(stored?.dismissible, false);
  });

  it("enregistre, met à jour, liste et supprime", async () => {
    const database = openDatabase();
    const parsed = parseAnnouncementDraft(
      {
        type: "info",
        message: "Les révisions express sont ouvertes.",
        linkLabel: "Réviser",
        linkUrl: "/app/revision",
        audience: "language",
        languageCode: "eng",
        startsAt: "2026-11-02T08:00",
        endsAt: "2026-11-10T18:00",
        dismissible: true,
        status: "published",
      },
      NOW,
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const id = await insertAnnouncement(database, parsed.draft);
    const banner = await loadStudentBanner(
      database,
      "eleve-1",
      { subscriptionStatus: "inactive", languageCodes: ["eng"] },
      NOW,
    );
    assert.equal(banner?.id, id);
    assert.equal(banner?.linkUrl, "/app/revision");
    assert.equal(
      await loadStudentBanner(database, "eleve-1", { subscriptionStatus: "inactive", languageCodes: ["spa"] }, NOW),
      null,
    );

    await updateAnnouncement(database, id, { ...parsed.draft, status: "draft" });
    const list = await listAnnouncements(database, NOW);
    assert.equal(list.length, 1);
    assert.equal(list[0]?.phase, "draft");
    assert.equal(list[0]?.audienceLabel, "Anglais");
    assert.equal(parseAnnouncementList({ announcements: list })?.[0]?.id, id);
    assert.equal(parseAnnouncementList({ announcements: [{ id: "x" }] }), null);

    const item = toAnnouncementListItem(
      {
        ...parsed.draft,
        id,
        status: "draft",
        createdAt: NOW,
      },
      NOW,
    );
    assert.equal(item.phaseLabel, "Brouillon");

    await deleteAnnouncement(database, id);
    assert.equal((await listAnnouncements(database, NOW)).length, 0);
    await assert.rejects(() => deleteAnnouncement(database, id), (error: unknown) => error instanceof AnnouncementError);
  });
});
