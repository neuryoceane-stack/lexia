import { redirect } from "next/navigation";
import { isTeacherSignupEnabled } from "@/lib/teacher-signup";
import TeacherWaitlistPage from "./waitlist-form";

export const dynamic = "force-dynamic";

export default function ProfesseurSignupPage() {
  if (isTeacherSignupEnabled()) {
    redirect("/signup?role=professeur");
  }
  return <TeacherWaitlistPage />;
}
