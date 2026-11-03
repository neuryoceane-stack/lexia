"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Search, UserRound } from "lucide-react";
import {
  FILTER_LABELS,
  STUDENT_FILTERS,
  STUDENT_PAGE_SIZE,
  countForFilter,
  filterPillLabel,
  pageRangeLabel,
  parseStudentList,
  type StudentFilter,
  type StudentListItem,
} from "@/lib/creator-students";
import {
  ErrorNote,
  LoadingNote,
  outlineButtonClass,
} from "./creator-ui";
import { StatusPill, StudentSheetPanel } from "./student-sheet";
import { useCreatorResource } from "./use-creator-resource";

function listUrl(filter: StudentFilter, search: string, page: number): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/api/creator/students?${query}` : "/api/creator/students";
}

export function StudentsListTab() {
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const committedSearch = useRef("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      if (committedSearch.current === next) return;
      committedSearch.current = next;
      setSearch(next);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const url = useMemo(() => listUrl(filter, search, page), [filter, search, page]);
  const { data, loading, error } = useCreatorResource(
    url,
    parseStudentList,
    "Impossible de charger les élèves.",
  );

  function chooseFilter(next: StudentFilter) {
    setFilter(next);
    setPage(1);
  }

  function openStudent(id: string) {
    lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(id);
  }

  function closeStudent() {
    setSelectedId(null);
    lastFocus.current?.focus();
  }

  async function exportCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (search) params.set("q", search);
      const response = await fetch(`/api/creator/students/export?${params}`);
      if (!response.ok) {
        setExportError("Impossible d'exporter les élèves.");
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const match = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
      link.href = objectUrl;
      link.download = match?.[1] ?? "eleves.csv";
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setExportError("Impossible d'exporter les élèves.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[28px] leading-tight text-ink">Élèves</h2>
          <p className="mt-1 text-sm text-muted">Retrouvez un élève et consultez son activité.</p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exporting}
          className={`${outlineButtonClass} self-start`}
        >
          <Download size={16} aria-hidden />
          {exporting ? "Export…" : "Exporter en CSV"}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {error ? <ErrorNote>{error}</ErrorNote> : null}
        {exportError ? <ErrorNote>{exportError}</ErrorNote> : null}
        {data && !data.promoCodesAvailable ? (
          <p className="m-0 text-sm text-muted">
            Les codes promo ne sont pas encore en place. La colonne Code indique « Non disponible ».
          </p>
        ) : null}
        {data && !data.cancellationsAvailable ? (
          <p className="m-0 text-sm text-muted">
            Le détail des résiliations n&apos;est pas encore en place. Un essai terminé peut s&apos;afficher
            comme « Sans abonnement » ou « Résilié ».
          </p>
        ) : null}

        <label className="relative block">
          <span className="sr-only">Rechercher par nom ou e-mail</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher par nom ou e-mail"
            className="min-h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ink"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filtrer les élèves">
          {STUDENT_FILTERS.map((item) => {
            const active = item === filter;
            const count = data ? countForFilter(data.counts, item) : null;
            return (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => chooseFilter(item)}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
                  active ? "bg-mark text-ink" : "border-[1.5px] border-ink bg-surface text-ink"
                }`}
              >
                {count == null ? FILTER_LABELS[item] : filterPillLabel(item, count)}
              </button>
            );
          })}
        </div>

        {loading && !data ? <LoadingNote>Chargement…</LoadingNote> : null}
        {data && data.counts.all === 0 && search === "" ? (
          <EmptyStudents body="Aucun élève pour le moment." />
        ) : data && data.total === 0 ? (
          <EmptyStudents body="Aucun élève dans cette sélection." />
        ) : null}
        {data && data.total > 0 && data.students.length === 0 ? (
          <div className="space-y-4">
            <EmptyStudents body="Cette page ne contient aucun élève." />
            {page > 1 ? (
              <button type="button" className={outlineButtonClass} onClick={() => setPage((current) => current - 1)}>
                Précédent
              </button>
            ) : null}
          </div>
        ) : null}
        {data && data.students.length > 0 ? (
          <StudentRows
            students={data.students}
            busy={loading}
            onOpen={openStudent}
          />
        ) : null}
        {data && data.total > STUDENT_PAGE_SIZE ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-sm text-muted">
              {pageRangeLabel(data.page, data.pageSize, data.total) ?? "Cette page ne contient aucun élève."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={outlineButtonClass}
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Précédent
              </button>
              <button
                type="button"
                className={outlineButtonClass}
                disabled={loading || page * data.pageSize >= data.total}
                onClick={() => setPage((current) => current + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedId ? <StudentSheetPanel studentId={selectedId} onClose={closeStudent} /> : null}
    </div>
  );
}

function EmptyStudents({ body }: { body: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface px-6 py-14 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
        <UserRound size={22} strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-4 text-sm text-muted">{body}</p>
    </div>
  );
}

function StudentRows({
  students,
  busy,
  onOpen,
}: {
  students: StudentListItem[];
  busy: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div aria-busy={busy}>
      <ul className="grid gap-3 md:hidden">
        {students.map((student) => (
          <li key={student.id}>
            <button
              type="button"
              onClick={() => onOpen(student.id)}
              className="w-full rounded-[14px] border border-line bg-surface px-4 py-4 text-left outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink"
            >
              <StudentIdentity student={student} />
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Field label="Inscription" value={student.signedUpLabel} />
                <Field label="Activité" value={student.lastActivityLabel} />
                <Field label="Listes" value={student.listLabel} />
                <Field label="Série" value={student.streakLabel} />
                <Field label="Code" value={student.codeLabel} />
              </dl>
            </button>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-[14px] border border-line bg-surface md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <caption className="sr-only">Élèves, triés par dernière activité</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="px-4 py-3 font-medium">Élève</th>
              <th scope="col" className="px-3 py-3 font-medium">Statut</th>
              <th scope="col" className="px-3 py-3 font-medium">Inscription</th>
              <th scope="col" className="px-3 py-3 font-medium">Dernière activité</th>
              <th scope="col" className="px-3 py-3 font-medium">Listes</th>
              <th scope="col" className="px-3 py-3 font-medium">Série</th>
              <th scope="col" className="px-4 py-3 font-medium">Code</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                tabIndex={0}
                className="cursor-pointer border-b border-line outline-none last:border-b-0 hover:bg-page focus-visible:bg-page"
                onClick={() => onOpen(student.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(student.id);
                  }
                }}
                aria-label={`Voir la fiche de ${student.name ?? student.email}`}
              >
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <StudentIdentity student={student} />
                </th>
                <td className="px-3 py-3">
                  <StatusPill status={student.status} label={student.statusLabel} />
                </td>
                <td className="px-3 py-3 text-ink">{student.signedUpLabel}</td>
                <td className="px-3 py-3 text-ink">{student.lastActivityLabel}</td>
                <td className="px-3 py-3 tabular-nums text-ink">{student.listLabel}</td>
                <td className="px-3 py-3 text-ink">{student.streakLabel}</td>
                <td className="px-4 py-3 text-ink">{student.codeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentIdentity({ student }: { student: StudentListItem }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="m-0 truncate font-medium text-ink">{student.name ?? student.email}</p>
        {student.name ? <p className="m-0 truncate text-sm text-muted">{student.email}</p> : null}
      </div>
      <span className="md:hidden">
        <StatusPill status={student.status} label={student.statusLabel} />
      </span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="m-0 text-ink">{value}</dd>
    </div>
  );
}
