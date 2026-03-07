"use client";

import { useState } from "react";

export function CreatorTabs() {
  const [tab, setTab] = useState<"analytics" | "feedbacks">("analytics");

  return (
    <>
      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setTab("analytics")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "analytics"
              ? "border-primary text-primary dark:border-primary-light dark:text-primary-light"
              : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Analytics
        </button>
        <button
          type="button"
          onClick={() => setTab("feedbacks")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "feedbacks"
              ? "border-primary text-primary dark:border-primary-light dark:text-primary-light"
              : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Feedbacks
        </button>
      </div>

      {tab === "analytics" && (
        <p className="text-slate-500 dark:text-slate-400">Analytics — à venir.</p>
      )}
      {tab === "feedbacks" && (
        <p className="text-slate-500 dark:text-slate-400">Feedbacks — à venir.</p>
      )}
    </>
  );
}
