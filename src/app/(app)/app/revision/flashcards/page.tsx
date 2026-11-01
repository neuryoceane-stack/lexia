import { redirect } from "next/navigation";
import { RevisionClient } from "../revision-client";
import { RevisionListSelection } from "../revision-list-selection";

const PAGE_BG = "var(--page)";

type Direction = "term_to_def" | "def_to_term";

function parseDirection(raw: string | undefined): Direction {
  return raw === "def_to_term" ? "def_to_term" : "term_to_def";
}

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    listIds?: string;
    session?: string;
    direction?: string;
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

  if (session) {
    if (initialListIds.length === 0) {
      redirect("/app/revision/flashcards");
    }
    return (
      <div
        className="min-h-full w-full -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:-my-10 sm:px-6 sm:py-10"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="mx-auto w-full">
          <RevisionClient
            initialMode="flashcard"
            initialListIds={initialListIds}
            initialDirection={direction}
            pickerPath="/app/revision/flashcards"
          />
        </div>
      </div>
    );
  }

  return <RevisionListSelection mode="flashcard" initialListIds={initialListIds} />;
}
