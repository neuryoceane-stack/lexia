import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countUrgentRevisionWords,
  pickRevisionSessionWords,
} from "./revision-session-words";

const now = new Date("2026-03-01T12:00:00.000Z");

function w(id: string): { id: string; listId: string; term: string; definition: string } {
  return { id, listId: "l1", term: id, definition: id };
}

describe("revision-session-words", () => {
  it("conserve l’ordre liste quand pas de limite", () => {
    const words = [w("a"), w("b"), w("c")];
    const map = new Map<string, Date>();
    assert.deepEqual(pickRevisionSessionWords(words, map, undefined, now), words);
    assert.deepEqual(pickRevisionSessionWords(words, map, 10, now), words);
  });

  it("priorise les retards puis les nouveaux", () => {
    const words = [w("new1"), w("late"), w("future"), w("new2")];
    const map = new Map<string, Date>([
      ["late", new Date("2026-02-01T12:00:00.000Z")],
      ["future", new Date("2026-04-01T12:00:00.000Z")],
    ]);
    const picked = pickRevisionSessionWords(words, map, 3, now);
    assert.deepEqual(
      picked.map((x) => x.id),
      ["late", "new1", "new2"]
    );
  });

  it("compte les mots urgents", () => {
    const map = new Map<string, Date>([
      ["a", new Date("2026-02-01T12:00:00.000Z")],
      ["b", new Date("2026-04-01T12:00:00.000Z")],
    ]);
    assert.equal(countUrgentRevisionWords(["a", "b", "c"], map, now), 2);
  });
});