import { redirectIfStudentPaywalled } from "@/lib/paywall";

export default async function RevisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfStudentPaywalled();
  return children;
}
