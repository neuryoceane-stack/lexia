import { RevisionClient } from "../revision-client";

export default function DicteePage() {
  return (
    <div className="bg-[var(--background)]">
      <RevisionClient initialMode="dictee" initialStep="lists" backHref="/app/revision" />
    </div>
  );
}
