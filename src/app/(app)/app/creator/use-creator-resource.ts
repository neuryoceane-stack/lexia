"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Charge une route créateur existante.
 * Une réponse invalide ou en échec reste visible : les données précédentes
 * ne sont pas remplacées par des zéros.
 */
export function useCreatorResource<T>(
  url: string,
  parse: (data: unknown) => T | null,
  errorMessage: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await fetch(url, { signal });
        const body: unknown = await res.json().catch(() => null);
        if (signal?.aborted) return;
        if (!res.ok) {
          setError(errorMessage);
          return;
        }
        const parsed = parse(body);
        if (parsed === null) {
          setError(errorMessage);
          return;
        }
        setData(parsed);
        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(errorMessage);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [url, parse, errorMessage],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return { data, setData, loading, error, setError, reload };
}
