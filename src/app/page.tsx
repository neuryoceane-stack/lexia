import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-100 px-4 dark:bg-slate-900">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Lexia
      </h1>
      <p className="text-center text-slate-600 dark:text-slate-400">
        Apprends du vocabulaire et suis ta progression.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/login"
          className="btn-relief rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-primary-dark"
        >
          Se connecter
        </Link>
        <Link
          href="/signup"
          className="btn-relief rounded-lg border border-slate-300 px-6 py-3 text-center font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          S&apos;inscrire
        </Link>
      </div>
    </div>
  );
}
