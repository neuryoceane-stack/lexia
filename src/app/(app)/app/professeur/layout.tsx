import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfesseurLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "professeur") redirect("/app");

  return <>{children}</>;
}
