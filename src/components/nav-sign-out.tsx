"use client";

import { signOut } from "next-auth/react";

export function NavSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
    >
      Déconnexion
    </button>
  );
}
