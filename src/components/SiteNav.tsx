"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export const areas = [
  { href: "/", label: "Wall" },
  { href: "/events", label: "Events" },
  { href: "/info", label: "Info" },
  { href: "/posts", label: "Posts" },
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
    <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 pb-3">
      {areas.map((area) => (
        <Link
          key={area.href}
          href={area.href}
          aria-current={area.href === current && !onAuth ? "page" : undefined}
          className={`border-b-2 pb-1 text-[12px] font-semibold uppercase tracking-[0.16em] ${
            area.href === current && !onAuth ? "border-cyan text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {area.label}
        </Link>
      ))}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {status === "authenticated" && label ? (
          <>
            <span className="hidden max-w-[12rem] truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 sm:inline">
              {label}
            </span>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="border-b-2 border-transparent pb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500 hover:text-neutral-300"
            >
              Sign out
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <Link
            href="/login"
            aria-current={onLogin ? "page" : undefined}
            className={`border-b-2 pb-1 text-[12px] font-semibold uppercase tracking-[0.16em] ${
              onLogin ? "border-cyan text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
