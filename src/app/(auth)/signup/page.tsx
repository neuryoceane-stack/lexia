import SignupForm from "./signup-form";
import { isTeacherSignupEnabled } from "@/lib/teacher-signup";
import { normalizeClassCode } from "@/lib/class-code";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; rejoindre?: string }>;
}) {
  const params = await searchParams;
  const teacherSignupEnabled = isTeacherSignupEnabled();
  const rejoindreCode = normalizeClassCode(params.rejoindre);
  const startAsTeacher = teacherSignupEnabled && params.role === "professeur";

  return (
    <SignupForm
      teacherSignupEnabled={teacherSignupEnabled}
      startAsTeacher={startAsTeacher}
      rejoindreCode={rejoindreCode}
    />
  );
}
