"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { focusRing } from "./ui";

type Theme = "light" | "dark";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};

const currentTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export const ThemeToggle = () => {
  const theme = useSyncExternalStore<Theme | null>(subscribe, currentTheme, () => null);
  const isDark = theme === "dark";

  const handleToggle = () => {
    const root = document.documentElement;
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    // Suppress per-element color transitions so the whole page swaps in one frame.
    root.classList.add("theme-switching");
    root.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Dark theme"
      aria-pressed={theme === null ? undefined : isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`pressable grid size-9 place-items-center rounded-lg bg-subtle text-fg-muted hover:bg-subtle-2 hover:text-fg ${focusRing}`}
    >
      {theme !== null &&
        (isDark ? <Sun aria-hidden className="size-[18px]" /> : <Moon aria-hidden className="size-[18px]" />)}
    </button>
  );
};
