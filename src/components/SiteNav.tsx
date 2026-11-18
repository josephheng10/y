"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export const areas = [
  { href: "/", label: "Wall" },
  { href: "/events", label: "Events" },
  { href: "/info", label: "Info" },
  { href: "/posts", label: "Fixx" },
  { href: "/ask", label: "Ask" },
] as const;

export type AreaHref = (typeof areas)[number]["href"];

export function SiteNav({ current }: { current: AreaHref }) {
  const pathname = usePathname();
  const { data, status } = useSession();
  const onAuth = pathname === "/login" || pathname === "/signup";
  const onLogin = pathname === "/login";
  const label = data?.user?.name || data?.user?.email;

  return (
    <nav className="mx-auto flex max-w-[600px] items-center gap-1 overflow-x-auto px-2 pb-0 no-scrollbar">
      {areas.map((area) => {
        const active = area.href === current && !onAuth;
        return (
          <Link
            key={area.href}
            href={area.href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 px-3 py-3 text-[15px] font-semibold transition ${
              active ? "text-[var(--text)]" : "text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
            }`}
          >
            {area.label}
            {active ? (
              <span className="absolute inset-x-3 bottom-0 h-1 rounded-full bg-[var(--accent)]" aria-hidden />
            ) : null}
          </Link>
        );
      })}
      <div className="ml-auto flex shrink-0 items-center gap-1 pr-2">
        {status === "authenticated" && label ? (
          <>
            <span className="hidden max-w-[10rem] truncate px-2 text-[13px] text-[var(--text-muted)] sm:inline">
              {label}
            </span>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="rounded-full px-3 py-2 text-[13px] font-semibold text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
            >
              Sign out
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <Link
            href="/login"
            aria-current={onLogin ? "page" : undefined}
            className={`rounded-full px-3 py-2 text-[13px] font-semibold ${
              onLogin ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
            }`}
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
