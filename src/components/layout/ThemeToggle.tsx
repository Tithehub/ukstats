import { useEffect, useState } from "react";

export type ThemeName = "dark" | "light";

export const THEME_KEY = "ukstats-theme";

/** Inline script that applies the stored theme before first paint. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t='dark';}var e=document.documentElement;e.classList.remove('theme-dark','theme-light','dark');e.classList.add(t==='light'?'theme-light':'theme-dark');if(t!=='light')e.classList.add('dark');e.style.colorScheme=t;}catch(_){}})();`;

function apply(theme: ThemeName) {
  const el = document.documentElement;
  el.classList.remove("theme-dark", "theme-light", "dark");
  el.classList.add(theme === "light" ? "theme-light" : "theme-dark");
  if (theme === "dark") el.classList.add("dark");
  el.style.colorScheme = theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const initial: ThemeName = stored === "light" ? "light" : "dark";
    setTheme(initial);
    apply(initial);
  }, []);

  const toggle = () => {
    const next: ThemeName = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable — the choice simply is not remembered */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={`grid size-9 shrink-0 place-items-center rounded-md border border-night-line/70 text-night-muted transition-colors hover:border-electric hover:text-night-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {theme === "dark" ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
          />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path
              strokeLinecap="round"
              d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            />
          </>
        )}
      </svg>
    </button>
  );
}
