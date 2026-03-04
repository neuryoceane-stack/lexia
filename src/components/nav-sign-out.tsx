"use client";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export function NavSignOut() {
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="btn-relief rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      Déconnexion
    </button>
  );
}
