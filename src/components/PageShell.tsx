import type { ReactNode } from "react";

export function PageShell({
  title,
  lede,
  children,
}: {
  title?: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <main className="content-column">
      {title ? (
        <header className="mb-6">
          <h1 className="page-title">{title}</h1>
          {lede ? <p className="mt-1.5 text-sm text-muted">{lede}</p> : null}
        </header>
      ) : null}
      {children}
    </main>
  );
}
