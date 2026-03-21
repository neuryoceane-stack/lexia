"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PRIMARY = "#6C3FC8";
const BORDER_SECONDARY = "var(--border)";
const RED_BORDER = "#F09595";
const RED_TEXT = "#E24B4A";

type LangDisplay = { flag: string; label: string } | null;

export function ClasseHeader({
  classId,
  initialTitle,
  languageDisplay,
  schoolLevel,
}: {
  classId: string;
  initialTitle: string;
  languageDisplay: LangDisplay;
  schoolLevel: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState<"rename" | "delete" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const next = title.trim();
    if (next.length < 2) {
      setError("Le nom doit faire au moins 2 caractères.");
      return;
    }
    setError("");
    setLoading("rename");
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la modification de la classe.");
        return;
      }
      setEditing(false);
      setTitle(data.title ?? next);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Supprimer cette classe et toutes les données associées (élèves, listes assignées) ? Cette action est irréversible."
      )
    ) {
      return;
    }
    setLoading("delete");
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la suppression de la classe.");
        setLoading(null);
        return;
      }
      router.push("/app/professeur/classes");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      style={{ marginBottom: 16 }}
    >
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={handleRename}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-md rounded-[10px] px-3 py-2 outline-none"
              style={{
                border: `1.5px solid ${PRIMARY}`,
                fontSize: 16,
                color: "var(--foreground)",
                background: "var(--input-bg)",
              }}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading === "rename"}
                className="cursor-pointer border-0"
                style={{
                  background: PRIMARY,
                  color: "white",
                  borderRadius: 16,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                  opacity: loading === "rename" ? 0.6 : 1,
                }}
              >
                {loading === "rename" ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setTitle(initialTitle);
                  setError("");
                }}
                className="cursor-pointer border-solid"
                style={{
                  borderRadius: 16,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 500,
                  border: `1.5px solid ${BORDER_SECONDARY}`,
                  background: "transparent",
                  color: "var(--foreground-muted)",
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "var(--foreground)",
                margin: "0 0 4px",
              }}
            >
              {title}
            </h1>
            <div
              className="flex flex-wrap items-center"
              style={{ gap: 8 }}
            >
              {languageDisplay && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--foreground-muted)",
                  }}
                >
                  <span aria-hidden>{languageDisplay.flag}</span>{" "}
                  {languageDisplay.label}
                </span>
              )}
              {schoolLevel && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: 8,
                    background: "#F0EDF8",
                    color: "#4B3A9E",
                  }}
                >
                  {schoolLevel}
                </span>
              )}
            </div>
          </>
        )}
        {error && (
          <p className="mt-2 text-[13px]" style={{ color: RED_TEXT }}>
            {error}
          </p>
        )}
      </div>
      {!editing && (
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="cursor-pointer border-solid"
            style={{
              border: `1.5px solid ${BORDER_SECONDARY}`,
              background: "transparent",
              color: "var(--foreground-muted)",
              borderRadius: 16,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading === "delete"}
            className="cursor-pointer border-solid"
            style={{
              border: `1.5px solid ${RED_BORDER}`,
              background: "transparent",
              color: RED_TEXT,
              borderRadius: 16,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
              opacity: loading === "delete" ? 0.6 : 1,
            }}
          >
            {loading === "delete" ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      )}
    </div>
  );
}
