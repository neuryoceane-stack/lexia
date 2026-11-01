"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const FEEDBACK_TYPES = [
  { value: "bug", label: "🐛 Bug" },
  { value: "idee", label: "✨ Idée" },
  { value: "question", label: "❓ Question" },
] as const;

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("bug");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const desc = description.trim();
    if (!desc) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description: desc, page: pathname }),
      });
      if (res.ok) {
        setSent(true);
        setDescription("");
        setTimeout(() => {
          setSent(false);
          setOpen(false);
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setOpen(false);
    setDescription("");
    setSent(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[92px] right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg transition hover:scale-105 md:bottom-6"
        style={{ backgroundColor: "var(--ink)", color: "var(--surface)" }}
        aria-label="Donner un retour"
      >
        💬
      </button>

      {open && (
        <div
          className="fixed bottom-[152px] right-6 z-50 w-80 animate-[feedback-slide-up_0.2s_ease-out] md:bottom-20"
          role="dialog"
          aria-labelledby="feedback-title"
        >
          <div className="relative rounded-xl rounded-br-sm bg-surface p-6 shadow-2xl">
            {/* Flèche pointant vers le bouton */}
            <div
              className="absolute -bottom-2 right-6 h-0 w-0 border-l-8 border-r-8 border-t-[10px] border-l-transparent border-r-transparent border-t-white"
              aria-hidden
            />
            <h2 id="feedback-title" className="mb-4 text-lg font-semibold text-ink">
              Un problème ou une idée ?
            </h2>

            {sent ? (
              <p className="py-8 text-center text-ink">
                ✓ Merci !
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="feedback-type" className="mb-1 block text-sm font-medium text-muted">
                    Type
                  </label>
                  <select
                    id="feedback-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {FEEDBACK_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="feedback-desc" className="mb-1 block text-sm font-medium text-muted">
                    Description <span className="text-false-text">*</span>
                  </label>
                  <textarea
                    id="feedback-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Décris ton retour..."
                    className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 rounded-lg border border-line bg-surface py-2 font-medium text-ink hover:bg-surface hover:border-ink"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="flex-1 rounded-lg py-2 font-medium text-surface disabled:opacity-50"
                    style={{ backgroundColor: "var(--ink)" }}
                  >
                    {loading ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
