"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePreference = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (value: ThemePreference) => void;
  /** Thème effectif (light ou dark) pour l’affichage. */
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("light");
  const [mounted, setMounted] = useState(false);

  const applyClass = useCallback((isDark: boolean) => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  // Charger la préférence depuis l’API au montage
  useEffect(() => {
    setMounted(true);
    fetch("/api/user/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.themePreference === "light" || data?.themePreference === "dark") {
          setThemeState(data.themePreference);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyClass(theme === "dark");
  }, [theme, mounted, applyClass]);

  const setTheme = useCallback((value: ThemePreference) => {
    setThemeState(value);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "light",
      setTheme: () => {},
      isDark: false,
    };
  }
  return ctx;
}
