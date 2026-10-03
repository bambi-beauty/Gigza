import { createContext, useContext, useEffect, useState } from "react";

export const FONTS = {
  inter:     { name: "Inter",          stack: "'Inter', system-ui, sans-serif",           url: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" },
  poppins:   { name: "Poppins",        stack: "'Poppins', system-ui, sans-serif",         url: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" },
  space:     { name: "Space Grotesk",  stack: "'Space Grotesk', system-ui, sans-serif",   url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" },
  playfair:  { name: "Playfair",       stack: "'Playfair Display', Georgia, serif",       url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" },
  jetbrains: { name: "JetBrains Mono", stack: "'JetBrains Mono', ui-monospace, monospace", url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" },
};

const FontContext = createContext(null);
const loaded = new Set();

function loadFont(id) {
  const font = FONTS[id];
  if (!font || loaded.has(id)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = font.url;
  document.head.appendChild(link);
  loaded.add(id);
}

export function FontProvider({ children }) {
  const [fontId, setFontId] = useState(() => {
    try { return localStorage.getItem("gigza:font") || "inter"; } catch { return "inter"; }
  });
  const [fontScale, setFontScale] = useState(() => {
    try { return Number(localStorage.getItem("gigza:fontScale")) || 1; } catch { return 1; }
  });

  useEffect(() => {
    loadFont(fontId);
    const font = FONTS[fontId] || FONTS.inter;
    document.documentElement.style.setProperty("--font-family", font.stack);
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    try {
      localStorage.setItem("gigza:font", fontId);
      localStorage.setItem("gigza:fontScale", String(fontScale));
    } catch {}
  }, [fontId, fontScale]);

  return (
    <FontContext.Provider value={{ fontId, setFontId, fontScale, setFontScale }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error("useFont must be used within FontProvider");
  return ctx;
}