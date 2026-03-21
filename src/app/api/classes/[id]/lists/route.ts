import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classLists, lists, wordFamilies } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/** Client sous-jacent Drizzle : LibSQL (execute) ou better-sqlite3 (prepare/run). */
type LibSqlRawClient = {
  execute?: (sql: string, args?: unknown[]) => Promise<unknown>;
  prepare?: (sql: string) => { run: (...args: unknown[]) => unknown };
};

/**
 * POST /api/classes/[id]/lists
 * Ajoute une liste à la classe (professeur).
 * Body: { listId: string, visibleFrom?: number (ms), dueDate?: number (ms) }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const role = user.role;
    if (role !== "professeur") {
      return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
    }

    const { id: classId } = await params;

    const [cls] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.teacherId, user.id)))
      .limit(1);

    if (!cls) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    }

    let body: {
      listId?: string;
      visibleFrom?: number | null;
      dueDate?: number | null;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const listId = body.listId?.trim();
    if (!listId) {
      return NextResponse.json({ error: "listId requis" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(classLists)
      .where(and(eq(classLists.classId, classId), eq(classLists.listId, listId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Liste déjà dans la classe" }, { status: 409 });
    }

    const [list] = await db
      .select({ id: lists.id, familyId: lists.familyId })
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1);

    if (!list) {
      return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
    }

    const [family] = await db
      .select({ userId: wordFamilies.userId })
      .from(wordFamilies)
      .where(eq(wordFamilies.id, list.familyId))
      .limit(1);

    if (!family || family.userId !== user.id) {
      return NextResponse.json({ error: "Liste non accessible" }, { status: 403 });
    }

    const existingLists = await db
      .select({ orderIndex: classLists.orderIndex })
      .from(classLists)
      .where(eq(classLists.classId, classId));

    const maxOrder =
      existingLists.length > 0
        ? Math.max(...existingLists.map((l) => l.orderIndex))
        : -1;

    const id = nanoid();
    const now = Math.floor(Date.now() / 1000);

    const sqlInsert = `INSERT INTO class_lists (id, class_id, list_id, is_visible, order_index, added_at) 
     VALUES (?, ?, ?, 0, ?, ?)`;
    const insertArgs = [id, classId, listId, maxOrder + 1, now];

    // SQL brut : évite Drizzle/LibSQL sur colonnes nullable. LibSQL = execute ; local = prepare().run
    const client = (db as { $client?: LibSqlRawClient }).$client;
    if (client && typeof client.execute === "function") {
      await client.execute(sqlInsert, insertArgs);
    } else if (client && typeof client.prepare === "function") {
      client.prepare(sqlInsert).run(...insertArgs);
    } else {
      throw new Error("Client DB sans execute/prepare (SQL brut impossible)");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
