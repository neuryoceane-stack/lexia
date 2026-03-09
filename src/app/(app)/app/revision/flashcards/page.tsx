import { RevisionClient } from "../revision-client";

export default function FlashcardsPage() {
  return (
    <div>
      <RevisionClient initialMode="flashcard" initialStep="lists" backHref="/app/revision" />
    </div>
  );
}
