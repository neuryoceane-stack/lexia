"use client";

import { signOut } from "next-auth/react";

export function NavSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="btn-relief rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      Déconnexion
    </button>
  );
}
