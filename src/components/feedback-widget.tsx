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
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg transition hover:scale-105"
        style={{ backgroundColor: "#6C3FC8", color: "white" }}
        aria-label="Donner un retour"
      >
        💬
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800"
            role="dialog"
            aria-labelledby="feedback-title"
          >
            <h2 id="feedback-title" className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Un problème ou une idée ?
            </h2>

            {sent ? (
              <p className="py-8 text-center text-green-600 dark:text-green-400">
                ✓ Merci !
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="feedback-type" className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
                    Type
                  </label>
                  <select
                    id="feedback-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {FEEDBACK_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="feedback-desc" className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="feedback-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Décris ton retour..."
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 rounded-lg border border-slate-300 bg-white py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !description.trim()}
                    className="flex-1 rounded-lg py-2 font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "#6C3FC8" }}
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
