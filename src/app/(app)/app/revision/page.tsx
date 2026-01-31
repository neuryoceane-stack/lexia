import { RevisionClient } from "./revision-client";

export default function RevisionPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Fiches de révision
      </h1>
      <RevisionClient />
    </div>
  );
}
