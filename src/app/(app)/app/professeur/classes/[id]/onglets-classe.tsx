"use client";

import Link from "next/link";
import { SalleAttente } from "./salle-attente";
import { ListesClasse } from "./listes-classe";
import { StatsEleves } from "./stats-eleves";

export type TabId = "tableau-de-bord" | "eleves" | "listes";

type Member = {
  id: string;
  userId: string | null;
  status: string;
  joinedAt: Date | null;
  name: string;
  email: string | null;
  stats: { sessions: number; wordsRetained: number; wordsWritten: number } | null;
};

type ClassList = {
  id: string;
  listId: string | null;
  isVisible: boolean;
  name: string;
  familyName: string;
};

type Props = {
  classId: string;
  activeTab: TabId;
  identifier: string;
  nbEleves: number;
  nbListes: number;
  members: Member[];
  lists: ClassList[];
  classLanguage: string | null;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "tableau-de-bord", label: "Tableau de bord" },
  { id: "eleves", label: "Élèves" },
  { id: "listes", label: "Listes de vocabulaire" },
];

export function OngletsClasse({
  classId,
  activeTab,
  identifier,
  nbEleves,
  nbListes,
  members,
  lists,
  classLanguage,
}: Props) {
  const baseHref = `/app/professeur/classes/${classId}`;

  return (
    <div className="mb-10">
      <nav
        className="flex gap-1 border-b border-slate-200 dark:border-slate-700"
        aria-label="Onglets de la classe"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`${baseHref}?tab=${tab.id}`}
            className={`rounded-t-lg px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border border-b-0 border-slate-200 bg-white text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-primary-light"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/30">
        {activeTab === "tableau-de-bord" && (
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Identifiant classe
              </p>
              <p className="mt-2 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
                {identifier}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                À partager avec vos élèves
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nombre d&apos;élèves
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">
                {nbEleves}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                acceptés dans la classe
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Listes de mots
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">
                {nbListes}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                assignées à la classe
              </p>
            </div>
          </div>
        )}

        {activeTab === "eleves" && (
          <div>
            <SalleAttente classId={classId} members={members} className="mb-8" />
            <StatsEleves members={members} />
          </div>
        )}

        {activeTab === "listes" && (
          <ListesClasse
            classId={classId}
            classLanguage={classLanguage}
            lists={lists}
          />
        )}
      </div>
    </div>
  );
}
