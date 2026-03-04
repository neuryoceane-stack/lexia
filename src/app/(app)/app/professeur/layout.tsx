import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfesseurLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  const role = user.role;
  if (role !== "professeur") redirect("/app");

  return <>{children}</>;
}
