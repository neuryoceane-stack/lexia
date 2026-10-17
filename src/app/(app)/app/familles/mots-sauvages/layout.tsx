import { redirectIfStudentPaywalled } from "@/lib/paywall";

export default async function MotsSauvagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfStudentPaywalled();
  return children;
}
