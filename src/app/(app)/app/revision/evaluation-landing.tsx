"use client";

import Link from "next/link";

function FlashcardIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--surface)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--muted)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

export function EvaluationLanding() {
  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>
          On s&apos;entraîne comment aujourd&apos;hui ?
        </h1>
        <p className="mt-1" style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
          Flashcards pour mémoriser, dictée pour ancrer.
        </p>
      </div>

      {/* Grille 3 cartes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* ──── Carte Flashcards ──── */}
        <Link
          href="/app/revision/flashcards"
          className="relative flex flex-col overflow-hidden no-underline card-hover"
          style={{
            background: "var(--background-subtle)",
            border: "1.5px solid var(--line)",
            borderRadius: 16,
            padding: "20px 16px 16px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "var(--ink)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--line)")
          }
        >
          {/* Cercle icône */}
          <div
            className="mb-3.5 flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--ink)",
            }}
          >
            <FlashcardIcon />
          </div>

          {/* Chips */}
          <div className="mb-2.5 flex flex-wrap gap-1">
            {["SM-2", "Swipe", "Timer"].map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--ink)",
                  background: "var(--background-subtle)",
                  borderRadius: 8,
                  padding: "2px 7px",
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Titre */}
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>
            Flashcards
          </p>

          {/* Description */}
          <p
            className="mt-1 flex-1"
            style={{ fontSize: 12, color: "var(--foreground-muted)", lineHeight: 1.5 }}
          >
            Révise avec des cartes intelligentes — l&apos;algorithme SM-2
            optimise ta mémorisation.
          </p>

          {/* Bouton + flèche */}
          <div className="mt-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                background: "var(--ink)",
                color: "var(--surface)",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Commencer
              <ArrowIcon color="var(--surface)" />
            </span>
            <span
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--background-subtle)",
              }}
            >
              <ArrowIcon color="var(--ink)" />
            </span>
          </div>

          {/* Cercle décoratif */}
          <div
            style={{
              position: "absolute",
              bottom: -20,
              right: -20,
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "var(--ink)",
              opacity: 0.1,
              pointerEvents: "none",
            }}
          />
        </Link>

        {/* ──── Carte Dictée ──── */}
        <Link
          href="/app/revision/dictee"
          className="card-dictee-bg relative flex flex-col overflow-hidden no-underline card-hover"
          style={{
            border: "1.5px solid var(--line)",
            borderRadius: 16,
            padding: "20px 16px 16px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "var(--ink)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--line)")
          }
        >
          <div
            className="mb-3.5 flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--mark)",
            }}
          >
            <PenIcon />
          </div>

          <div className="mb-2.5 flex flex-wrap gap-1">
            {["Mémoire active", "Feedback"].map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--ink)",
                  background: "var(--mark)",
                  borderRadius: 8,
                  padding: "2px 7px",
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>
            Dictée
          </p>

          <p
            className="mt-1 flex-1"
            style={{ fontSize: 12, color: "var(--foreground-muted)", lineHeight: 1.5 }}
          >
            Écris la traduction de mémoire — le mode le plus efficace pour
            ancrer les mots.
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                background: "var(--ink)",
                color: "var(--surface)",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Commencer
              <ArrowIcon color="var(--surface)" />
            </span>
            <span
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--mark)",
              }}
            >
              <ArrowIcon color="var(--ink)" />
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: -20,
              right: -20,
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "var(--ink)",
              opacity: 0.1,
              pointerEvents: "none",
            }}
          />
        </Link>

        {/* ──── Carte Prononciation (désactivée) ──── */}
        <div
          className="card-prononciation-bg relative flex flex-col overflow-hidden"
          style={{
            border: "1.5px solid var(--line)",
            borderRadius: 16,
            padding: "20px 16px 16px",
            opacity: 0.55,
            cursor: "default",
          }}
        >
          {/* Badge Bientôt */}
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              fontSize: 10,
              fontWeight: 500,
              color: "var(--muted)",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 100,
              padding: "2px 8px",
            }}
          >
            Bientôt
          </span>

          <div
            className="mb-3.5 flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--surface)",
              border: "1.5px solid var(--line)",
            }}
          >
            <MicIcon />
          </div>

          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground-muted)" }}>
            Prononciation
          </p>

          <p
            className="mt-1 flex-1"
            style={{ fontSize: 12, color: "var(--foreground-disabled)", lineHeight: 1.5 }}
          >
            Enregistre ta voix et obtiens un score phonétique — arrive
            bientôt.
          </p>

          <p
            className="mt-3"
            style={{ fontSize: 12, fontStyle: "italic", color: "var(--foreground-disabled)" }}
          >
            Prochainement
          </p>
        </div>
      </div>
    </div>
  );
}
