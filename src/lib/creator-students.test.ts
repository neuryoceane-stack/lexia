import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import {
  DAY_MS,
  INACTIVE_AFTER_MS,
  STUDENT_PAGE_SIZE,
  buildUsageReport,
  choosePrimaryLanguage,
  codeLabel,
  countDeltaHint,
  currentStreakFromDayIndexes,
  dictationDeltaHint,
  dictationPresentation,
  dictationSuccessPercent,
  distributePercents,
  filterPillLabel,
  foldSearch,
  formatListsAndWords,
  formatStreak,
  formatStudentWhen,
  groupLanguageShares,
  groupModeShares,
  isInactive,
  isStudentId,
  likeContains,
  mostChosenGoalLabel,
  pageRangeLabel,
  parsePage,
  parseStudentFilter,
  parseStudentList,
  parseStudentSearch,
  parseUsageReport,
  resolveStudentStatus,
  sharePercent,
  statusDetail,
  studentCsv,
  studentDisplayName,
  studentInitial,
  summarizeWeeklyGoals,
  trialDaysRemaining,
  utcDayIndex,
  utcWeekStart,
  type StudentFacts,
} from "./creator-students";
import { loadStudentCsv, loadStudentList, loadStudentSheet, loadUsage } from "./creator-students-stats";

const NOW = new Date("2026-11-03T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;

describe("resolveStudentStatus", () => {
  it("lit le statut d'abonnement et ne devine l'essai terminé qu'avec une résiliation d'essai", () => {
    assert.equal(resolveStudentStatus("trialing", null), "trialing");
    assert.equal(resolveStudentStatus("active", "trial"), "active");
    assert.equal(resolveStudentStatus("past_due", null), "past_due");
    assert.equal(resolveStudentStatus("canceled", "monthly"), "canceled");
    assert.equal(resolveStudentStatus("canceled", "annual"), "canceled");
    assert.equal(resolveStudentStatus("canceled", null), "canceled");
    assert.equal(resolveStudentStatus("canceled", "trial"), "trial_ended");
    assert.equal(resolveStudentStatus("inactive", null), "inactive");
    assert.equal(resolveStudentStatus("inactive", "trial"), "trial_ended");
    assert.throws(() => resolveStudentStatus("paused", null), /inattendu/);
  });
});

describe("isInactive", () => {
  it("compte sept jours pile, et l'inscription s'il n'y a aucune révision", () => {
    const signedUp = new Date("2026-01-01T00:00:00.000Z");
    assert.equal(isInactive(new Date(NOW.getTime() - INACTIVE_AFTER_MS), signedUp, NOW), true);
    assert.equal(isInactive(new Date(NOW.getTime() - INACTIVE_AFTER_MS + 1), signedUp, NOW), false);
    assert.equal(isInactive(null, new Date(NOW.getTime() - INACTIVE_AFTER_MS), NOW), true);
    assert.equal(isInactive(null, new Date(NOW.getTime() - DAY_MS), NOW), false);
    assert.equal(isInactive(new Date(NOW.getTime() - HOUR), new Date(NOW.getTime() - 30 * DAY_MS), NOW), false);
  });
});

describe("parts en pourcentage", () => {
  it("n'affiche pas 0 % quand le dénominateur est vide", () => {
    assert.equal(sharePercent(0, 0), null);
    assert.equal(sharePercent(1, 0), null);
    assert.equal(dictationSuccessPercent(0, 0), null);
    assert.equal(dictationSuccessPercent(3, 4), 75);
    assert.equal(sharePercent(1, 2), 50);
    assert.equal(sharePercent(0, 5), 0);
  });

  it("répartit 100 points sans en perdre", () => {
    assert.deepEqual(distributePercents([1, 1, 1]), [34, 33, 33]);
    assert.deepEqual(distributePercents([25, 6, 5, 4]), [63, 15, 12, 10]);
    assert.deepEqual(distributePercents([0, 0]), [0, 0]);
    assert.equal(distributePercents([2, 1, 1]).reduce((sum, part) => sum + part, 0), 100);
    assert.throws(() => distributePercents([-1]), /négative/);
  });

  it("groupe les langues au-delà du top et les codes inconnus dans Autres", () => {
    const rows = groupLanguageShares([
      { label: "Anglais", words: 46 },
      { label: "Espagnol", words: 22 },
      { label: "Italien", words: 15 },
      { label: "Allemand", words: 12 },
      { label: "Portugais", words: 3 },
      { label: null, words: 2 },
    ]);
    assert.deepEqual(
      rows.map((row) => row.label),
      ["Anglais", "Espagnol", "Italien", "Allemand", "Autres"],
    );
    assert.equal(rows.reduce((sum, row) => sum + row.percent, 0), 100);
    assert.equal(rows[4]?.percent, 5);
  });

  it("garde Dictée à 0 % s'il n'y a que des flashcards", () => {
    assert.deepEqual(groupModeShares([]), []);
    assert.deepEqual(groupModeShares([{ mode: "flashcard", sessions: 2 }]), [
      { label: "Flashcards", percent: 100 },
      { label: "Dictée", percent: 0 },
    ]);
  });

  it("compare la dictée sur 4 semaines sans inventer l'écart", () => {
    assert.deepEqual(dictationPresentation(null, 50), {
      percent: null,
      hint: "Aucune dictée sur les 7 derniers jours.",
    });
    assert.equal(dictationPresentation(71, null).hint, "Pas de comparaison : aucune dictée il y a 4 semaines.");
    assert.equal(dictationPresentation(71, 67).hint, "+4 points sur 4 semaines");
    assert.equal(dictationDeltaHint(-1), "−1 point sur 4 semaines");
    assert.equal(dictationDeltaHint(0), "Identique sur 4 semaines");
    assert.equal(countDeltaHint(-3), "−3 par rapport à la semaine dernière");
    assert.equal(countDeltaHint(0), "Identique à la semaine dernière");
  });
});

describe("série, objectif et libellés", () => {
  it("casse la série s'il n'y a rien aujourd'hui", () => {
    const today = utcDayIndex(NOW);
    assert.equal(currentStreakFromDayIndexes([today, today - 1, today - 2], today), 3);
    assert.equal(currentStreakFromDayIndexes([today, today - 1, today - 3], today), 2);
    assert.equal(currentStreakFromDayIndexes([today - 1, today - 2], today), 0);
  });

  it("ouvre la semaine le lundi UTC", () => {
    assert.equal(utcWeekStart(NOW).toISOString(), "2026-11-02T00:00:00.000Z");
    assert.equal(utcWeekStart(new Date("2026-11-02T00:00:00.000Z")).toISOString(), "2026-11-02T00:00:00.000Z");
    assert.equal(utcWeekStart(new Date("2026-11-08T22:00:00.000Z")).toISOString(), "2026-11-02T00:00:00.000Z");
  });

  it("compte les objectifs atteints et départage l'égalité vers le plus petit", () => {
    const summary = summarizeWeeklyGoals(
      [
        { goal: 20, words: 20 },
        { goal: 20, words: 19 },
        { goal: 0, words: 10 },
      ],
      [
        { goal: 20, students: 4 },
        { goal: 10, students: 4 },
      ],
    );
    assert.equal(summary.activeStudents, 3);
    assert.equal(summary.reachedStudents, 1);
    assert.equal(summary.percent, 33);
    assert.deepEqual(summary.mostChosen, { words: 10, students: 4 });
    assert.equal(mostChosenGoalLabel({ words: 1 }), "Objectif le plus choisi : 1 mot par semaine");
    assert.equal(summarizeWeeklyGoals([], []).percent, null);
  });

  it("formate les dates de Paris et le détail d'essai", () => {
    assert.equal(formatStudentWhen(new Date("2026-11-03T00:30:00.000Z"), NOW), "aujourd'hui");
    assert.equal(formatStudentWhen(new Date("2026-11-02T22:30:00.000Z"), NOW), "hier");
    assert.equal(formatStudentWhen(new Date("2026-10-22T12:00:00.000Z"), NOW), "il y a 12 jours");
    assert.equal(studentDisplayName({ firstName: " Élève ", lastName: "Martin", name: "Compte" }), "Élève Martin");
    assert.equal(studentDisplayName({ firstName: null, lastName: " ", name: "Compte" }), "Compte");
    assert.equal(studentDisplayName({ firstName: null, lastName: null, name: "  " }), null);
    assert.equal(studentInitial("Élève", "a@exemple.fr"), "É");
    assert.equal(codeLabel(null, true), "—");
    assert.equal(codeLabel("PREPA-A", false), "Non disponible");
    assert.equal(formatStreak(0), "0 jour");
    assert.equal(formatStreak(1), "1 jour");
    assert.equal(formatStreak(2), "2 jours");
    assert.equal(formatListsAndWords(3, 61), "3 · 61");
    const end = new Date(NOW.getTime() + 11 * DAY_MS);
    assert.equal(trialDaysRemaining(end, NOW), 11);
    assert.equal(statusDetail({ status: "trialing", periodEnd: end, now: NOW }), "Essai : 11 jours restants");
    assert.equal(
      statusDetail({ status: "trialing", periodEnd: new Date(NOW.getTime() + DAY_MS), now: NOW }),
      "Essai : 1 jour restant",
    );
    assert.equal(statusDetail({ status: "trialing", periodEnd: null, now: NOW }), null);
    assert.equal(statusDetail({ status: "past_due", periodEnd: end, now: NOW }), null);
    assert.match(statusDetail({ status: "active", periodEnd: end, now: NOW }) ?? "", /^Renouvellement le /);
  });

  it("choisit la langue la plus révisée, sinon la préférence", () => {
    assert.equal(
      choosePrimaryLanguage(
        [
          { label: "Italien", words: 4 },
          { label: "Anglais", words: 25 },
        ],
        "Allemand",
      ),
      "Anglais",
    );
    assert.equal(choosePrimaryLanguage([{ label: null, words: 5 }], "Espagnol"), "Espagnol");
    assert.equal(choosePrimaryLanguage([], null), null);
  });

  it("replie les accents et refuse une recherche trop longue", () => {
    assert.equal(foldSearch("  Élève  "), "eleve");
    assert.equal(likeContains("100%_"), "%100\\%\\_%");
    assert.equal(parseStudentFilter("trial"), "trial");
    assert.equal(parseStudentFilter("autre"), null);
    assert.equal(parsePage("0"), null);
    assert.equal(parsePage("2"), 2);
    assert.equal(parseStudentSearch("x".repeat(121)).ok, false);
    assert.equal(isStudentId("abc_DEF-12"), true);
    assert.equal(isStudentId("a b"), false);
    assert.equal(pageRangeLabel(1, 50, 0), null);
    assert.equal(pageRangeLabel(1, 50, 12), "12 élèves");
    assert.equal(pageRangeLabel(2, 50, 120), "51–100 sur 120 élèves");
    assert.equal(pageRangeLabel(2, 50, 51), "51 sur 51 élèves");
    assert.equal(filterPillLabel("inactive", 48), "Inactifs depuis 7 jours · 48");
  });

  it("préfixe une cellule qui ressemblerait à une formule", () => {
    const facts: StudentFacts = {
      id: "s",
      email: "a@exemple.fr",
      name: "=1+1",
      firstName: null,
      lastName: null,
      subscriptionStatus: "inactive",
      signedUpAt: NOW,
      lastActivityAt: null,
      listCount: 0,
      promoCode: null,
      cancellationPlan: null,
      streak: 0,
    };
    const csv = studentCsv([facts], NOW, true);
    assert.match(csv, /Élève,E-mail,Statut/);
    assert.match(csv, /'=1\+1/);
    assert.match(csv, /Aucune révision/);
    assert.match(csv, /Sans abonnement/);
  });

  it("refuse une réponse incomplète", () => {
    assert.equal(parseStudentList({ counts: { all: 1 } }), null);
    assert.equal(parseUsageReport({ periodLabel: "autre" }), null);
    const report = buildUsageReport({
      studentCount: 0,
      sessionsCurrent: 0,
      sessionsPrevious: 0,
      wordsCurrent: 0,
      wordsPrevious: 0,
      dictationRetainedCurrent: 0,
      dictationSeenCurrent: 0,
      dictationRetainedBaseline: 0,
      dictationSeenBaseline: 0,
      modes: [],
      languages: [],
      activeGoals: [],
      chosenGoals: [],
    });
    assert.equal(report.dictation.percent, null);
    assert.equal(report.goals.historyAvailable, false);
    assert.equal(report.goals.percent, null);
    assert.ok(parseUsageReport(report));
  });
});

const SCHEMA = `
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  weekly_goal INTEGER NOT NULL,
  subscription_status TEXT NOT NULL,
  subscription_current_period_end INTEGER
);
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT
);
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  preferred_language TEXT
);
CREATE TABLE word_families (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL
);
CREATE TABLE lists (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL
);
CREATE TABLE words (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL
);
CREATE TABLE revision_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  direction TEXT NOT NULL,
  language TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  words_seen INTEGER NOT NULL,
  words_retained INTEGER NOT NULL,
  words_written INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL
);
CREATE TABLE promo_code_redemptions (
  id TEXT PRIMARY KEY,
  promo_code_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  redeemed_at INTEGER NOT NULL
);
CREATE TABLE cancellation_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  cancelled_at INTEGER NOT NULL
);
`;

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function memoryDb(schema = SCHEMA) {
  const sqlite = new Database(":memory:");
  sqlite.exec(schema);
  return { sqlite, database: drizzle(sqlite) };
}

describe("lectures élèves", () => {
  const nowSec = unix(NOW);

  function seed() {
    const { sqlite, database } = memoryDb();
    const insertUser = sqlite.prepare(
      `INSERT INTO users
        (id, email, name, role, created_at, weekly_goal, subscription_status, subscription_current_period_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertUser.run("s-active", "camille.martin@exemple.fr", "Camille", "student", unix(new Date(NOW.getTime() - 12 * DAY_MS)), 20, "active", nowSec + 20 * 86400);
    insertUser.run("s-trial", "eleve.martin@exemple.fr", null, "student", unix(new Date(NOW.getTime() - 2 * DAY_MS)), 20, "trialing", nowSec + 11 * 86400);
    insertUser.run("s-due", "impaye@exemple.fr", "Impayé", "student", unix(new Date(NOW.getTime() - 40 * DAY_MS)), 10, "past_due", null);
    insertUser.run("s-ended", "essai.fini@exemple.fr", "Essai Fini", "student", unix(new Date(NOW.getTime() - 21 * DAY_MS)), 20, "canceled", null);
    insertUser.run("s-never", "jamais@exemple.fr", null, "student", unix(new Date(NOW.getTime() - 30 * DAY_MS)), 30, "inactive", null);
    insertUser.run("s-rev", "revision@exemple.fr", "Révision Seule", "student", unix(new Date(NOW.getTime() - 40 * DAY_MS)), 20, "inactive", null);
    insertUser.run("teacher", "prof@exemple.fr", "Prof", "teacher", nowSec, 5, "active", null);
    insertUser.run("creator", "createur@exemple.fr", "Créateur", "creator", nowSec, 20, "active", null);
    for (let index = 0; index < 45; index += 1) {
      const id = `pad-${String(index).padStart(2, "0")}`;
      insertUser.run(id, `${id}@exemple.fr`, index === 0 ? "=cmd" : null, "student", unix(new Date(NOW.getTime() - 40 * DAY_MS)), 20, "inactive", null);
    }

    sqlite.prepare("INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (?, ?, ?)").run("s-trial", "Élève", "Martin");
    sqlite.prepare("INSERT INTO user_preferences (user_id, preferred_language) VALUES (?, ?)").run("s-active", "deu");
    sqlite.prepare("INSERT INTO user_preferences (user_id, preferred_language) VALUES (?, ?)").run("s-never", "spa");

    const session = sqlite.prepare(
      `INSERT INTO revision_sessions
        (id, user_id, mode, direction, language, started_at, ended_at, duration_seconds, words_seen, words_retained, words_written, created_at)
       VALUES (?, ?, ?, 'term_to_def', ?, ?, ?, 60, ?, ?, 0, ?)`,
    );
    const at = (offsetMs: number) => unix(new Date(NOW.getTime() + offsetMs));
    session.run("a1", "s-active", "flashcard", "eng", at(-HOUR), at(-HOUR), 10, 8, at(-HOUR));
    session.run("a2", "s-active", "flashcard", "eng", at(-20 * HOUR), at(-20 * HOUR), 15, 10, at(-20 * HOUR));
    session.run("a3", "s-active", "dictee", "ita", at(-2 * HOUR), at(-2 * HOUR), 4, 3, at(-2 * HOUR));
    session.run("a4", "s-active", "dictee", "spa", at(-10 * DAY_MS), at(-10 * DAY_MS), 4, 1, at(-10 * DAY_MS));
    session.run("a5", "s-active", "dictee", "spa", at(-30 * DAY_MS), at(-30 * DAY_MS), 10, 5, at(-30 * DAY_MS));
    session.run("t1", "s-trial", "flashcard", "spa", at(-DAY_MS), at(-DAY_MS), 5, 4, at(-DAY_MS));
    session.run("d1", "s-due", "flashcard", "deu", at(-3 * DAY_MS), at(-3 * DAY_MS), 6, 2, at(-3 * DAY_MS));
    session.run("r1", "s-rev", "flashcard", "eng", at(-20 * DAY_MS), at(-20 * DAY_MS), 9, 9, at(-20 * DAY_MS));
    session.run("p1", "teacher", "flashcard", "deu", at(-HOUR), at(-HOUR), 1000, 1000, at(-HOUR));

    sqlite.prepare("INSERT INTO revisions (id, user_id, created_at) VALUES (?, ?, ?)").run("rev-ended", "s-ended", at(-10 * DAY_MS));
    sqlite.prepare("INSERT INTO revisions (id, user_id, created_at) VALUES (?, ?, ?)").run("rev-seule", "s-rev", at(-2 * HOUR));

    sqlite.prepare("INSERT INTO promo_codes (id, code) VALUES (?, ?)").run("old", "ANCIEN");
    sqlite.prepare("INSERT INTO promo_codes (id, code) VALUES (?, ?)").run("new", "PREPA-A");
    const redeem = sqlite.prepare(
      "INSERT INTO promo_code_redemptions (id, promo_code_id, user_id, redeemed_at) VALUES (?, ?, ?, ?)",
    );
    redeem.run("red-1", "old", "s-active", at(-20 * DAY_MS));
    redeem.run("red-2", "new", "s-active", at(-2 * DAY_MS));

    sqlite.prepare(
      "INSERT INTO cancellation_feedback (id, user_id, plan, cancelled_at) VALUES (?, ?, ?, ?)",
    ).run("old-cancel", "s-ended", "monthly", at(-40 * DAY_MS));
    sqlite.prepare(
      "INSERT INTO cancellation_feedback (id, user_id, plan, cancelled_at) VALUES (?, ?, ?, ?)",
    ).run("trial-cancel", "s-ended", "trial", at(-10 * DAY_MS));

    sqlite.prepare("INSERT INTO word_families (id, user_id) VALUES (?, ?)").run("fam", "s-active");
    sqlite.prepare("INSERT INTO lists (id, family_id) VALUES (?, ?)").run("l1", "fam");
    sqlite.prepare("INSERT INTO lists (id, family_id) VALUES (?, ?)").run("l2", "fam");
    const word = sqlite.prepare("INSERT INTO words (id, list_id) VALUES (?, ?)");
    for (const id of ["w1", "w2", "w3"]) word.run(id, "l1");
    for (const id of ["w4", "w5"]) word.run(id, "l2");

    return { sqlite, database };
  }

  it("filtre, pagine, exclut les autres rôles et calcule l'usage", async () => {
    const { database } = seed();
    const list = await loadStudentList(database, { filter: "all", query: "", page: 1, now: NOW });
    assert.equal(list.counts.all, 51);
    assert.equal(list.counts.trial, 1);
    assert.equal(list.counts.subscribed, 1);
    assert.equal(list.counts.inactive, 47);
    assert.equal(list.total, 51);
    assert.equal(list.students.length, STUDENT_PAGE_SIZE);
    assert.equal(list.students[0]?.id, "s-active");
    assert.equal(list.students[0]?.name, "Camille");
    assert.equal(list.students[0]?.status, "active");
    assert.equal(list.students[0]?.codeLabel, "PREPA-A");
    assert.equal(list.students[0]?.streakLabel, "2 jours");
    assert.equal(list.students[0]?.listLabel, "2");
    assert.equal(list.students[0]?.lastActivityLabel, "aujourd'hui");
    assert.equal(list.students[1]?.id, "s-rev");
    assert.ok(list.students.every((student) => student.email !== "prof@exemple.fr" && student.email !== "createur@exemple.fr"));

    const page2 = await loadStudentList(database, { filter: "all", query: "", page: 2, now: NOW });
    assert.equal(page2.students.length, 1);
    assert.equal(page2.students[0]?.id, "s-never");
    assert.equal(page2.students[0]?.lastActivityLabel, "Aucune révision");
    assert.equal(page2.students[0]?.statusLabel, "Sans abonnement");

    const inactive = await loadStudentList(database, { filter: "inactive", query: "", page: 1, now: NOW });
    assert.equal(inactive.total, 47);
    assert.equal(inactive.students[0]?.id, "s-ended");
    assert.equal(inactive.students[0]?.status, "trial_ended");
    assert.ok(inactive.students.every((student) => student.id !== "s-active"));

    const subscribed = await loadStudentList(database, { filter: "subscribed", query: "", page: 1, now: NOW });
    assert.deepEqual(subscribed.students.map((student) => student.id), ["s-active"]);

    const byName = await loadStudentList(database, { filter: "all", query: "élève", page: 1, now: NOW });
    assert.equal(byName.counts.all, 1);
    assert.equal(byName.counts.trial, 1);
    assert.equal(byName.students[0]?.id, "s-trial");
    assert.equal(byName.students[0]?.name, "Élève Martin");
    assert.equal(byName.students[0]?.initial, "É");

    const sheet = await loadStudentSheet(database, "s-active", NOW);
    assert.ok(sheet);
    assert.equal(sheet.statusLabel, "Abonné");
    assert.match(sheet.statusDetail ?? "", /^Renouvellement le /);
    assert.equal(sheet.promoCode, "PREPA-A");
    assert.deepEqual(
      sheet.fields.map((field) => field.value),
      ["il y a 12 jours", "aujourd'hui", "2 · 5", "2 jours", "5", "Anglais"],
    );
    const trial = await loadStudentSheet(database, "s-trial", NOW);
    assert.equal(trial?.statusDetail, "Essai : 11 jours restants");
    const never = await loadStudentSheet(database, "s-never", NOW);
    assert.equal(never?.fields.find((field) => field.label === "Langue principale")?.value, "Espagnol");
    assert.equal(await loadStudentSheet(database, "teacher", NOW), null);

    const usage = await loadUsage(database, NOW);
    assert.equal(usage.studentCount, 51);
    assert.equal(usage.sessions.value, 5);
    assert.equal(usage.sessions.hint, "+4 par rapport à la semaine dernière");
    assert.equal(usage.words.value, 40);
    assert.equal(usage.words.hint, "+36 par rapport à la semaine dernière");
    assert.equal(usage.dictation.percent, 75);
    assert.equal(usage.dictation.hint, "+25 points sur 4 semaines");
    assert.deepEqual(usage.modes, [
      { label: "Flashcards", percent: 80 },
      { label: "Dictée", percent: 20 },
    ]);
    assert.deepEqual(usage.languages, [
      { label: "Anglais", percent: 63 },
      { label: "Allemand", percent: 15 },
      { label: "Espagnol", percent: 12 },
      { label: "Italien", percent: 10 },
    ]);
    assert.equal(usage.goals.historyAvailable, false);
    assert.equal(usage.goals.activeStudents, 2);
    assert.equal(usage.goals.reachedStudents, 1);
    assert.equal(usage.goals.percent, 50);
    assert.equal(usage.goals.mostChosenLabel, "Objectif le plus choisi : 20 mots par semaine");

    const csv = await loadStudentCsv(database, { filter: "subscribed", query: "", now: NOW });
    assert.match(csv, /camille\.martin@exemple\.fr/);
    assert.doesNotMatch(csv, /prof@exemple\.fr/);
    const allCsv = await loadStudentCsv(database, { filter: "all", query: "", now: NOW });
    assert.match(allCsv, /'=cmd/);
  });

  it("signale un code promo indisponible quand la table n'existe pas", async () => {
    const schema = SCHEMA.replace(/CREATE TABLE promo_codes[\s\S]*?CREATE TABLE cancellation_feedback/m, "CREATE TABLE cancellation_feedback");
    const { sqlite, database } = memoryDb(schema);
    sqlite.prepare(
      `INSERT INTO users (id, email, name, role, created_at, weekly_goal, subscription_status, subscription_current_period_end)
       VALUES ('seul', 'seul@exemple.fr', 'Seul', 'student', ?, 20, 'inactive', NULL)`,
    ).run(unix(NOW));
    const list = await loadStudentList(database, { filter: "all", query: "", page: 1, now: NOW });
    assert.equal(list.promoCodesAvailable, false);
    assert.equal(list.cancellationsAvailable, true);
    assert.equal(list.students[0]?.codeLabel, "Non disponible");
  });

  it("échoue sur un statut d'abonnement inconnu", async () => {
    const { sqlite, database } = memoryDb();
    sqlite.prepare(
      `INSERT INTO users (id, email, name, role, created_at, weekly_goal, subscription_status, subscription_current_period_end)
       VALUES ('odd', 'odd@exemple.fr', NULL, 'student', ?, 20, 'paused', NULL)`,
    ).run(unix(NOW));
    await assert.rejects(
      loadStudentList(database, { filter: "all", query: "", page: 1, now: NOW }),
      /inattendu/,
    );
  });
});
