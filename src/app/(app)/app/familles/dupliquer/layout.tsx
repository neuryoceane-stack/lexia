import { redirectIfStudentPaywalled } from "@/lib/paywall";

export default async function DupliquerListeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfStudentPaywalled();
  return children;
}
