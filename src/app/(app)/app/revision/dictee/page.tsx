import { redirect } from "next/navigation";
import { RevisionClient } from "../revision-client";
import { RevisionListSelection } from "../revision-list-selection";
import { parseRevisionSessionWordLimitQuery } from "@/lib/revision-session-word-limit";

const PAGE_BG = "var(--page)";

type Direction = "term_to_def" | "def_to_term";

function parseDirection(raw: string | undefined): Direction {
  return raw === "def_to_term" ? "def_to_term" : "term_to_def";
}

export default async function DicteePage({
  searchParams,
}: {
  searchParams: Promise<{
    listIds?: string;
    session?: string;
    direction?: string;
    wordLimit?: string;
  }>;
}) {
  const sp = await searchParams;
  const initialListIds =
    sp?.listIds
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const session = sp?.session === "1";
  const direction = parseDirection(sp?.direction);
  const wordLimit = parseRevisionSessionWordLimitQuery(sp?.wordLimit);

  if (session) {
    if (initialListIds.length === 0) {
      redirect("/app/revision/dictee");
    }
    return (
      <div
        className="min-h-full w-full -my-8 py-8 sm:-my-10 sm:py-10"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="mx-auto w-full">
          <RevisionClient
            initialMode="dictee"
            initialListIds={initialListIds}
            initialDirection={direction}
            initialWordLimit={wordLimit}
            pickerPath="/app/revision/dictee"
          />
        </div>
      </div>
    );
  }

  return <RevisionListSelection mode="dictee" initialListIds={initialListIds} />;
}
