"use client";

import { useUiPrefs } from "./UiPrefs";

export function UiToggles() {
  const { theme, mobilePreview, toggleTheme, toggleMobilePreview, ready } = useUiPrefs();

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        className="inline-flex h-9 items-center rounded-full border border-[var(--border)] px-3 text-[12px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
      >
        {ready ? (theme === "dark" ? "Light" : "Dark") : "Theme"}
      </button>
      <button
        type="button"
        onClick={toggleMobilePreview}
        aria-pressed={mobilePreview}
        aria-label={mobilePreview ? "Exit mobile preview" : "Enter mobile preview"}
        title="Mobile UI"
        className={`inline-flex h-9 items-center rounded-full border px-3 text-[12px] font-semibold transition ${
          mobilePreview
            ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
            : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
        }`}
      >
        Mobile
      </button>
    </div>
  );
}
