import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNav, type AreaHref } from "./SiteNav";

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
    <div className="min-h-dvh bg-[#070708] text-ink">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070708]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-baseline gap-3 px-4 py-3">
          <Link href="/" className="font-display text-4xl leading-none tracking-tight">
            Y
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">New Haven</p>
        </div>
        <SiteNav current={current} />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="font-display text-6xl leading-none">{title}</h1>
        {lede ? <p className="mt-2 max-w-xl text-sm text-neutral-400">{lede}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
