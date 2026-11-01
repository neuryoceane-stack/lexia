import { redirectIfStudentPaywalled } from "@/lib/paywall";

export default async function NouvelleListeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfStudentPaywalled();
  return children;
}
