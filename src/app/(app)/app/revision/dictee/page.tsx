import { RevisionClient } from "../revision-client";

export default function DicteePage() {
  return (
    <div>
      <RevisionClient initialMode="dictee" initialStep="lists" backHref="/app/revision" />
    </div>
  );
}
