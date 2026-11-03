import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";

/** Profil minimal pour le layout (onboarding), une requête par utilisateur et par rendu. */
export const getLayoutUserProfile = cache(async (userId: string) => {
  return db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
});
