/** L'inscription professeur n'est ouverte que si la variable vaut exactement "true". */
export function isTeacherSignupEnabled(): boolean {
  return process.env.TEACHER_SIGNUP_ENABLED === "true";
}
