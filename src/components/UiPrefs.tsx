"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light";

type UiPrefs = {
  theme: ThemeMode;
  mobilePreview: boolean;
  ready: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setMobilePreview: (on: boolean) => void;
  toggleMobilePreview: () => void;
};

const THEME_KEY = "y-theme";
const MOBILE_KEY = "y-mobile-preview";

const UiPrefsContext = createContext<UiPrefs | null>(null);

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("y-ui-prefs", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("y-ui-prefs", onStoreChange);
  };
}

function emit() {
  window.dispatchEvent(new Event("y-ui-prefs"));
}

function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "dark";
}

function readMobile(): boolean {
  try {
    return localStorage.getItem(MOBILE_KEY) === "1";
  } catch {
    return false;
  }
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as ThemeMode);
  const mobilePreview = useSyncExternalStore(subscribe, readMobile, () => false);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const setTheme = useCallback((next: ThemeMode) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
    emit();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  const setMobilePreview = useCallback((on: boolean) => {
    try {
      localStorage.setItem(MOBILE_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  const toggleMobilePreview = useCallback(() => {
    setMobilePreview(!readMobile());
  }, [setMobilePreview]);

  const value = useMemo(
    () => ({
      theme,
      mobilePreview,
      ready,
      setTheme,
      toggleTheme,
      setMobilePreview,
      toggleMobilePreview,
    }),
    [theme, mobilePreview, ready, setTheme, toggleTheme, setMobilePreview, toggleMobilePreview],
  );

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs() {
  const ctx = useContext(UiPrefsContext);
  if (!ctx) throw new Error("useUiPrefs must be used inside UiPrefsProvider");
  return ctx;
}
