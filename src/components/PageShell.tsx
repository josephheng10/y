"use client";

import type { ReactNode } from "react";
import { AppChrome } from "./AppChrome";
import type { AreaHref } from "./SiteNav";

export function PageShell({
  current,
  title,
  lede,
  children,
}: {
  current: AreaHref;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <AppChrome current={current}>
      <main className="mx-auto max-w-[600px] px-4 py-5">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text)]">{title}</h1>
        {lede ? <p className="mt-1 text-[15px] leading-5 text-[var(--text-muted)]">{lede}</p> : null}
        <div className="mt-5">{children}</div>
      </main>
    </AppChrome>
  );
}
