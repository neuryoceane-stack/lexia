"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, Plus } from "lucide-react";

const PRIMARY = "#6C3FC8";
const GREEN = "#1D9E75";
const GOLD = "#F5A623";
const BORDER_TERTIARY = "#E2DCF5";
const OVERLAY = "rgba(80,60,120,0.18)";
const RED_BORDER = "#F09595";
const RED_TEXT = "#E24B4A";
const ICON_ORANGE = "#C47D0A";

type ClassList = {
  id: string;
  listId: string | null;
  isVisible: boolean;
  name: string;
  familyName: string;
  wordCount: number;
  masteryPct: number;
};

type BibliothequeList = {
  id: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
};

type Props = {
  classId: string;
  classLanguage: string | null;
  lists: ClassList[];
  className?: string;
};

export function ListesClasse({
  classId,
  classLanguage,
  lists: initialLists,
  className = "",
}: Props) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [bibliotheque, setBibliotheque] = useState<BibliothequeList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [adding, setAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);

  useEffect(() => {
    fetch("/api/bibliotheque")
      .then((r) => r.json())
      .then((data) => setBibliotheque(data.lists ?? []))
      .catch(() => {});
  }, []);

  const addedListIds = new Set(lists.map((l) => l.listId).filter(Boolean));
  const availableLists = bibliotheque.filter((l) => !addedListIds.has(l.id));

  async function handleAdd() {
    if (!selectedListId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/classes/${classId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: selectedListId }),
      });
      if (res.ok) {
        router.refresh();
        setSelectedListId("");
        setModalOpen(false);
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleVisibility(listId: string, isVisible: boolean) {
    setToggling(listId);
    try {
      const res = await fetch(`/api/classes/${classId}/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !isVisible }),
      });
      if (res.ok) router.refresh();
    } catch {
      /* erreur réseau : pas de fallback silencieux masqué côté UX */
    } finally {
      setToggling(null);
    }
  }

  async function handleRemove(listId: string, name: string) {
    if (
      !window.confirm(
        `Retirer la liste « ${name} » de cette classe ? Les progrès des élèves sur cette liste restent dans leur compte.`
      )
    ) {
      return;
    }
    setRemoving(listId);
    try {
      const res = await fetch(`/api/classes/${classId}/lists/${listId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(
          typeof data.error === "string"
            ? data.error
            : "Impossible de retirer la liste."
        );
        return;
      }
      router.refresh();
    } finally {
      setRemoving(null);
    }
  }

  return (
    <section className={className}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--foreground-muted)",
          margin: "0 0 10px",
        }}
      >
        Listes assignées à cette classe
      </p>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 14,
          border: `0.5px solid ${BORDER_TERTIARY}`,
        }}
      >
        {lists.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--foreground-muted)",
              margin: "0 0 12px",
            }}
          >
            Aucune liste. Assignez des listes depuis votre bibliothèque.
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {lists.map((l, idx) => {
              const last = idx === lists.length - 1;
              const lid = l.listId ?? "";
              return (
                <li
                  key={l.id}
                  className="flex items-center gap-2.5"
                  style={{
                    padding: "10px 0",
                    borderBottom: last
                      ? "none"
                      : `0.5px solid ${BORDER_TERTIARY}`,
                  }}
                >
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      background: "#FEF3DC",
                      borderRadius: 8,
                    }}
                  >
                    <FileText
                      size={16}
                      stroke={ICON_ORANGE}
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        margin: 0,
                        color: "var(--foreground)",
                      }}
                    >
                      {l.name}
                      {!l.isVisible && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: "var(--foreground-muted)",
                            marginLeft: 6,
                          }}
                        >
                          (fantôme)
                        </span>
                      )}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--foreground-muted)",
                        margin: "2px 0 0",
                      }}
                    >
                      {l.wordCount} mot{l.wordCount !== 1 ? "s" : ""} ·{" "}
                      {l.masteryPct}% de maîtrise moyenne
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      title={
                        l.isVisible
                          ? "Masquer aux élèves (fantôme)"
                          : "Rendre visible"
                      }
                      disabled={toggling === lid}
                      onClick={() => handleToggleVisibility(lid, l.isVisible)}
                      className="flex cursor-pointer items-center justify-center border-0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "var(--background-subtle)",
                        opacity: toggling === lid ? 0.5 : 1,
                      }}
                    >
                      {l.isVisible ? (
                        <Eye
                          size={16}
                          stroke={PRIMARY}
                          strokeWidth={2}
                          aria-hidden
                        />
                      ) : (
                        <EyeOff
                          size={16}
                          stroke="var(--foreground-muted)"
                          strokeWidth={2}
                          aria-hidden
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={removing === lid}
                      onClick={() => handleRemove(lid, l.name)}
                      className="cursor-pointer border-solid"
                      style={{
                        border: `1px solid ${RED_BORDER}`,
                        background: "transparent",
                        color: RED_TEXT,
                        borderRadius: 12,
                        padding: "5px 12px",
                        fontSize: 11,
                        fontWeight: 500,
                        opacity: removing === lid ? 0.6 : 1,
                      }}
                    >
                      {removing === lid ? "…" : "Retirer"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left"
          style={{
            paddingTop: lists.length > 0 ? 14 : 0,
            marginTop: lists.length > 0 ? 4 : 0,
            borderTop:
              lists.length > 0 ? `0.5px solid ${BORDER_TERTIARY}` : undefined,
          }}
        >
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 32,
              height: 32,
              background: "#EAF4EF",
              borderRadius: 8,
            }}
          >
            <Plus size={16} stroke={GREEN} strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p
              style={{
                fontSize: 13,
                color: PRIMARY,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Assigner une nouvelle liste
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-muted)",
                margin: "2px 0 0",
              }}
            >
              Depuis votre bibliothèque
            </p>
          </div>
          <span
            className="shrink-0 cursor-pointer border-0"
            style={{
              background: PRIMARY,
              color: "white",
              borderRadius: 12,
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Assigner
          </span>
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: OVERLAY }}
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="assign-liste-title"
            className="w-full max-w-[400px] rounded-[20px] border bg-white p-5 shadow-lg"
            style={{ borderColor: "rgba(108,63,200,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="assign-liste-title"
              style={{
                fontSize: 15,
                fontWeight: 500,
                margin: "0 0 12px",
                color: "var(--foreground)",
              }}
            >
              Assigner une liste
            </h2>
            <p style={{ fontSize: 12, color: "var(--foreground-muted)", margin: "0 0 12px" }}>
              Langue de la classe : {classLanguage ?? "—"}
            </p>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="mb-4 w-full rounded-[10px] border px-3 py-2.5 text-[13px] outline-none"
              style={{
                borderColor: BORDER_TERTIARY,
                background: "var(--background-subtle)",
                color: "var(--foreground)",
              }}
            >
              <option value="">— Choisir une liste —</option>
              {availableLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.wordCount} mots)
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 cursor-pointer border-solid"
                style={{
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  border: `1.5px solid var(--border)`,
                  background: "transparent",
                  color: "var(--foreground-muted)",
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!selectedListId || adding}
                onClick={handleAdd}
                className="flex-[2] cursor-pointer border-0"
                style={{
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  background: PRIMARY,
                  color: "white",
                  opacity: !selectedListId || adding ? 0.6 : 1,
                }}
              >
                {adding ? "Ajout…" : "Assigner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
