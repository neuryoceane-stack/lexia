"use client";

import { createContext, useContext } from "react";
import type { ClientStudentEntitlement } from "@/lib/student-entitlement-types";

const StudentEntitlementContext = createContext<ClientStudentEntitlement | null>(
  null
);

export function StudentEntitlementProvider({
  entitlement,
  children,
}: {
  entitlement: ClientStudentEntitlement | null;
  children: React.ReactNode;
}) {
  return (
    <StudentEntitlementContext.Provider value={entitlement}>
      {children}
    </StudentEntitlementContext.Provider>
  );
}

export function useStudentEntitlement(): ClientStudentEntitlement | null {
  return useContext(StudentEntitlementContext);
}