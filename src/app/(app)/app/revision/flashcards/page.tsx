import { redirect } from "next/navigation";
import { RevisionClient } from "../revision-client";
import { RevisionListSelection } from "../revision-list-selection";

const PAGE_BG = "#F8F7FF";

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

  if (session) {
    if (initialListIds.length === 0) {
      redirect("/app/revision/flashcards");
    }
    return (
      <div
        className="min-h-full w-full -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:-my-10 sm:px-6 sm:py-10"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="mx-auto max-w-lg">
          <RevisionClient
            initialMode="flashcard"
            initialListIds={initialListIds}
            initialDirection="term_to_def"
            pickerPath="/app/revision/flashcards"
          />
        </div>
      </div>
    );
  }

  return <RevisionListSelection mode="flashcard" initialListIds={initialListIds} />;
}
