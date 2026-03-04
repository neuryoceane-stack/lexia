"use client";

import { useState, useEffect } from "react";
import type { User } from "@/lib/auth";

type UseUserResult = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json().catch(() => ({}));
      setUser(data.user ?? null);
    } catch {
      setError("Impossible de charger l'utilisateur");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { user, loading, error, refetch };
}
