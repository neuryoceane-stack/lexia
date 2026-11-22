/**
 * Parcours API du pilote professeur.
 *
 * À lancer uniquement contre un Next.js local dont la base n'est pas la production.
 * Le serveur doit avoir TEACHER_SIGNUP_ENABLED=true (absent = inscription fermée).
 *
 *   TEACHER_SIGNUP_ENABLED=true npx next dev --hostname 127.0.0.1 --port 3000
 *   node scripts/pilote-professeur.mjs
 *
 * Le script s'arrête si l'hôte n'est pas 127.0.0.1 ou localhost, si
 * TURSO_DATABASE_URL est présent dans son environnement, ou si GET /api/health
 * indique Turso. Il ne modifie aucune base distante.
 */

const baseUrl = process.env.PILOTE_BASE_URL ?? "http://127.0.0.1:3000";
const password = "Pilote1Local";

function abort(message) {
  console.error(message);
  process.exit(1);
}

function assertLoopback() {
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    abort(`Adresse illisible : ${baseUrl}`);
  }
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    abort(
      `Refus : ${url.hostname} n'est pas une adresse locale. Ce script ne parle qu'à 127.0.0.1 ou localhost.`
    );
  }
  if (process.env.TURSO_DATABASE_URL) {
    abort(
      "Refus : TURSO_DATABASE_URL est défini dans l'environnement du script. Retirez-le avant de relancer."
    );
  }
}

assertLoopback();

const stamp = Date.now().toString(36);
const teacherEmail = `pilote-prof-${stamp}@example.test`;
const studentAEmail = `pilote-eleve-a-${stamp}@example.test`;
const studentBEmail = `pilote-eleve-b-${stamp}@example.test`;

function jar() {
  return new Map();
}

function cookieHeader(cookies) {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function remember(cookies, response) {
  const lines =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const line of lines) {
    const pair = line.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function request(cookies, path, options = {}) {
  const headers = new Headers(options.headers);
  const cookie = cookieHeader(cookies);
  if (cookie) headers.set("cookie", cookie);
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  remember(cookies, response);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  return { status: response.status, data };
}

function expectStatus(step, result, status) {
  if (result.status !== status) {
    abort(
      `${step} : statut ${result.status}, attendu ${status}. ${JSON.stringify(result.data)}`
    );
  }
  return result.data;
}

async function register(cookies, body) {
  return request(cookies, "/api/auth/register", { method: "POST", body });
}

async function login(cookies, email) {
  const result = await request(cookies, "/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  expectStatus(`connexion ${email}`, result, 200);
  if (!cookies.has("auth-token")) {
    abort(`connexion ${email} : le cookie auth-token est absent.`);
  }
}

async function main() {
  const health = await request(jar(), "/api/health");
  const dbLabel = health.data && typeof health.data.db === "string" ? health.data.db : "";
  if (/turso/i.test(dbLabel)) {
    abort(
      `Refus : ${baseUrl} parle à Turso (« ${dbLabel} »). Ce script ne s'exécute que sur SQLite local.`
    );
  }
  if (!/sqlite/i.test(dbLabel)) {
    abort(`Refus : base non reconnue comme locale (statut ${health.status}, db « ${dbLabel} »).`);
  }
  if (health.status !== 200) {
    const detail = health.data && typeof health.data.error === "string" ? health.data.error : "";
    console.log(
      `Santé SQLite locale pas encore prête (${health.status}${detail ? ` : ${detail}` : ""}). La première inscription aligne les colonnes locales.`
    );
  } else {
    console.log(`Santé OK : ${dbLabel}`);
  }

  const teacher = jar();
  const createdTeacher = await register(teacher, {
    email: teacherEmail,
    password,
    firstName: "Camille",
    lastName: "Pilote",
    role: "professeur",
    subject: "Anglais",
    school_name: "Collège du test local",
  });
  expectStatus("inscription professeur", createdTeacher, 200);
  if (createdTeacher.data.role !== "professeur") {
    abort("L'inscription professeur n'a pas renvoyé le rôle professeur.");
  }
  await login(teacher, teacherEmail);

  const createdClass = expectStatus(
    "création de classe",
    await request(teacher, "/api/classes", {
      method: "POST",
      body: { title: "3e A pilote", language: "eng", schoolLevel: "3e" },
    }),
    200
  );
  const classId = createdClass.id;
  const displayCode = `LX-${createdClass.identifier}`;
  if (!classId || !createdClass.identifier) {
    abort("La classe créée n'a pas d'identifiant.");
  }
  console.log(`Classe ${displayCode}`);

  const createdList = expectStatus(
    "création de liste",
    await request(teacher, "/api/listes", {
      method: "POST",
      body: { name: "Liste pilote", language: "eng" },
    }),
    200
  );
  const word = expectStatus(
    "ajout d'un mot",
    await request(teacher, `/api/listes/${createdList.id}/mots`, {
      method: "POST",
      body: { term: "harbour", definition: "port" },
    }),
    200
  );
  expectStatus(
    "assignation de liste",
    await request(teacher, `/api/classes/${classId}/lists`, {
      method: "POST",
      body: { listId: createdList.id },
    }),
    200
  );
  expectStatus(
    "visibilité de la liste",
    await request(teacher, `/api/classes/${classId}/lists/${createdList.id}`, {
      method: "PATCH",
      body: { isVisible: true },
    }),
    200
  );

  const studentA = jar();
  expectStatus(
    "inscription élève A",
    await register(studentA, {
      email: studentAEmail,
      password,
      firstName: "Léa",
      lastName: "A",
      role: "etudiant",
    }),
    200
  );
  await login(studentA, studentAEmail);
  const joinA = expectStatus(
    "élève A rejoint avec le préfixe LX-",
    await request(studentA, "/api/classes/join", {
      method: "POST",
      body: { identifier: displayCode },
    }),
    200
  );
  if (joinA.status !== "pending" || joinA.already !== false) {
    abort(`Élève A : attente d'une nouvelle demande, reçu ${JSON.stringify(joinA)}`);
  }

  const studentB = jar();
  expectStatus(
    "inscription élève B (compte déjà existant avant le lien)",
    await register(studentB, {
      email: studentBEmail,
      password,
      firstName: "Noé",
      lastName: "B",
      role: "etudiant",
    }),
    200
  );
  await login(studentB, studentBEmail);
  const joinB = expectStatus(
    "élève B rejoint avec le code nu",
    await request(studentB, "/api/classes/join", {
      method: "POST",
      body: { identifier: createdClass.identifier },
    }),
    200
  );
  if (joinB.status !== "pending") {
    abort(`Élève B : demande non enregistrée. ${JSON.stringify(joinB)}`);
  }

  const invalid = await request(studentA, "/api/classes/join", {
    method: "POST",
    body: { identifier: "LX-NOSUCH" },
  });
  if (invalid.status !== 404) {
    abort(`Code inconnu : statut ${invalid.status}, attendu 404.`);
  }

  const again = expectStatus(
    "élève A déjà membre",
    await request(studentA, "/api/classes/join", {
      method: "POST",
      body: { identifier: displayCode },
    }),
    200
  );
  if (again.already !== true || again.status !== "pending") {
    abort(`Déjà membre : ${JSON.stringify(again)}`);
  }

  const detail = expectStatus(
    "détail de classe",
    await request(teacher, `/api/classes/${classId}`),
    200
  );
  const memberA = (detail.members ?? []).find((m) => m.email === studentAEmail);
  if (!memberA?.userId) abort("L'élève A n'apparaît pas dans la classe.");
  expectStatus(
    "acceptation de l'élève A",
    await request(teacher, `/api/classes/${classId}/members/${memberA.userId}`, {
      method: "PATCH",
      body: { status: "accepted" },
    }),
    200
  );

  const revision = expectStatus(
    "révision de la liste de classe",
    await request(
      studentA,
      `/api/revision?listIds=${encodeURIComponent(createdList.id)}&all=1`
    ),
    200
  );
  const found = (revision.words ?? []).some((w) => w.id === word.id);
  if (!found) {
    abort("Le mot de la liste de classe est absent de la révision de l'élève A.");
  }
  expectStatus(
    "enregistrement d'une révision",
    await request(studentA, "/api/revision", {
      method: "POST",
      body: { wordId: word.id, rating: 2 },
    }),
    200
  );

  const patched = expectStatus(
    "tentative de changement de rôle",
    await request(studentA, "/api/user/profile", {
      method: "PATCH",
      body: { role: "professeur" },
    }),
    200
  );
  if (patched.role !== "etudiant") {
    abort(`Le rôle a été modifié : ${patched.role}`);
  }
  const classesAsStudent = await request(studentA, "/api/classes");
  if (classesAsStudent.status !== 403) {
    abort(
      `Après le PATCH, l'élève accède aux classes professeur (statut ${classesAsStudent.status}).`
    );
  }

  expectStatus(
    "suppression de la classe",
    await request(teacher, `/api/classes/${classId}`, { method: "DELETE" }),
    200
  );
  const gone = await request(studentB, "/api/classes/join", {
    method: "POST",
    body: { identifier: displayCode },
  });
  if (gone.status !== 404) {
    abort(`Classe supprimée : statut ${gone.status}, attendu 404.`);
  }

  console.log("Parcours pilote terminé.");
  console.log(`Professeur : ${teacherEmail}`);
  console.log(`Élève A : ${studentAEmail}`);
  console.log(`Élève B : ${studentBEmail}`);
  console.log(`Mot de passe local : ${password}`);
}

main().catch((error) => {
  abort(error instanceof Error ? error.stack ?? error.message : String(error));
});
