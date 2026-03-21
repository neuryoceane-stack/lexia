import { RevisionClient } from "../revision-client";

export default function FlashcardsPage() {
  return (
    <div className="bg-[var(--background)]">
      <RevisionClient initialMode="flashcard" initialStep="lists" backHref="/app/revision" />
    </div>
  );
}
