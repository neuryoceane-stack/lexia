import { getUser } from "@/lib/auth";
import { ParametresClient } from "./parametres-client";

export default async function ParametresPage() {
  const user = await getUser();
  const role = user?.role ?? "etudiant";
  return (
    <div>
      <ParametresClient role={role} />
    </div>
  );
}
