"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const themeSubscribers = new Set<() => void>();

function subscribeToTheme(onStoreChange: () => void) {
  themeSubscribers.add(onStoreChange);
  return () => {
    themeSubscribers.delete(onStoreChange);
  };
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    try {
      window.localStorage.setItem("nexo-theme", nextIsDark ? "dark" : "light");
    } catch {
      // Keep the current tab responsive even when storage is unavailable.
    }
    themeSubscribers.forEach((subscriber) => subscriber());
  }

  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}