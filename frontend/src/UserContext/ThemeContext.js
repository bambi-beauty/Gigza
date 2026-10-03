// src/UserContext/ThemeContext.js
import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = {
  dark: {
    name: "Dark",
    preview: "linear-gradient(135deg,#18181b,#09090b)",
    vars: {
      "--bg": "#050507",
      "--bg-elev": "#0c0c10",
      "--card": "rgba(255,255,255,0.035)",
      "--card-hover": "rgba(255,255,255,0.07)",
      "--border": "rgba(255,255,255,0.08)",
      "--text": "#fafafa",
      "--text-dim": "#a1a1aa",
      "--text-mute": "#52525b",
      "--accent": "#a855f7",
      "--accent-2": "#ec4899",
      "--accent-3": "#3b82f6",
    },
  },
  light: {
    name: "Light",
    preview: "linear-gradient(135deg,#f4f4f5,#e4e4e7)",
    vars: {
      "--bg": "#fafafa",
      "--bg-elev": "#ffffff",
      "--card": "rgba(0,0,0,0.03)",
      "--card-hover": "rgba(0,0,0,0.06)",
      "--border": "rgba(0,0,0,0.08)",
      "--text": "#09090b",
      "--text-dim": "#52525b",
      "--text-mute": "#a1a1aa",
      "--accent": "#7c3aed",
      "--accent-2": "#db2777",
      "--accent-3": "#2563eb",
    },
  },
  amoled: {
    name: "AMOLED",
    preview: "linear-gradient(135deg,#000,#0a0a0a)",
    vars: {
      "--bg": "#000000",
      "--bg-elev": "#0a0a0a",
      "--card": "rgba(255,255,255,0.025)",
      "--card-hover": "rgba(255,255,255,0.05)",
      "--border": "rgba(255,255,255,0.06)",
      "--text": "#ffffff",
      "--text-dim": "#71717a",
      "--text-mute": "#3f3f46",
      "--accent": "#a855f7",
      "--accent-2": "#ec4899",
      "--accent-3": "#3b82f6",
    },
  },
  midnight: {
    name: "Midnight",
    preview: "linear-gradient(135deg,#0f172a,#1e1b4b)",
    vars: {
      "--bg": "#0b1020",
      "--bg-elev": "#111834",
      "--card": "rgba(99,102,241,0.06)",
      "--card-hover": "rgba(99,102,241,0.12)",
      "--border": "rgba(99,102,241,0.18)",
      "--text": "#e0e7ff",
      "--text-dim": "#a5b4fc",
      "--text-mute": "#6366f1",
      "--accent": "#818cf8",
      "--accent-2": "#c084fc",
      "--accent-3": "#38bdf8",
    },
  },
  ocean: {
    name: "Ocean",
    preview: "linear-gradient(135deg,#042f2e,#0c4a6e)",
    vars: {
      "--bg": "#041a1a",
      "--bg-elev": "#062c2c",
      "--card": "rgba(20,184,166,0.06)",
      "--card-hover": "rgba(20,184,166,0.12)",
      "--border": "rgba(20,184,166,0.2)",
      "--text": "#ccfbf1",
      "--text-dim": "#5eead4",
      "--text-mute": "#0d9488",
      "--accent": "#14b8a6",
      "--accent-2": "#06b6d4",
      "--accent-3": "#3b82f6",
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem("gigza:theme") || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    const theme = THEMES[themeId] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute("data-theme", themeId);
    try { localStorage.setItem("gigza:theme", themeId); } catch {}
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, theme: THEMES[themeId] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}