import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { isFreemiumEnabled } from "@/lib/freemium";

export default async function Home() {
  const user = await getUser();
  if (user?.id) redirect("/app");

  return <LandingPage freemiumEnabled={isFreemiumEnabled()} />;
}
