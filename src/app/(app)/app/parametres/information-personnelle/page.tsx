import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { InformationPersonnelleClient } from "./information-personnelle-client";
import { ensureClassTables } from "@/lib/db/migrations";

export default async function InformationPersonnellePage() {
  const user = await getUser();
  if (!user?.id) redirect("/login");

  await ensureClassTables();

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  const [userRow] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const initialData = {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    email: userRow?.email ?? "",
    role: profile?.role ?? null,
    institutionName: profile?.institutionName ?? "",
    city: profile?.city ?? "",
    dateOfBirth: profile?.dateOfBirth ?? "",
    phone: profile?.phone ?? "",
  };

  return (
    <div className="bg-[var(--background)]">
      <InformationPersonnelleClient initialData={initialData} />
    </div>
  );
}
