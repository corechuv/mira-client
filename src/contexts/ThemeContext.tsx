// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "pm.theme";

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  // если нет сохранённого — берём системную
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // навешиваем атрибут сразу, чтобы не мигало
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []); // один раз на монт

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const value: ThemeCtx = {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    set: (t) => setTheme(t),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
