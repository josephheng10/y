"use client";

import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { SiteNav, type AreaHref } from "./SiteNav";
import { UiToggles } from "./UiToggles";
import { useUiPrefs } from "./UiPrefs";

export function AppChrome({
  current,
  children,
  headerExtra,
  hideBottomPad,
}: {
  current: AreaHref;
  children: ReactNode;
  headerExtra?: ReactNode;
  hideBottomPad?: boolean;
}) {
  const { mobilePreview } = useUiPrefs();

  const shell = (
    <div className={`min-h-dvh bg-[var(--bg)] text-[var(--text)] ${hideBottomPad ? "" : ""}`}>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3 px-4 py-3">
          <BrandMark />
          <UiToggles />
        </div>
        <SiteNav current={current} />
        {headerExtra}
      </header>
      {children}
    </div>
  );

  if (!mobilePreview) return shell;

  return (
    <div className="min-h-dvh bg-[var(--mobile-stage)] px-3 py-6 sm:px-6">
      <div className="mx-auto flex max-w-[430px] flex-col">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
          Mobile preview
        </p>
        <div className="overflow-hidden rounded-[2rem] border border-[var(--border-strong)] bg-[var(--bg)] shadow-[0_0_0_1px_var(--border),0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="mx-auto mt-2 h-1.5 w-24 rounded-full bg-[var(--border-strong)]" aria-hidden />
          <div className="max-h-[min(860px,92dvh)] overflow-y-auto">{shell}</div>
        </div>
      </div>
    </div>
  );
}
