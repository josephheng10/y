"use client";

import Link from "next/link";

export const areas = [
  { href: "/", label: "Wall" },
  { href: "/events", label: "Events" },
  { href: "/info", label: "Info" },
  { href: "/posts", label: "Posts" },
  { href: "/ask", label: "Ask" },
] as const;

export type AreaHref = (typeof areas)[number]["href"];

export function SiteNav({ current }: { current: AreaHref }) {
  return (
    <nav className="mx-auto flex max-w-5xl gap-4 px-4 pb-3">
      {areas.map((area) => (
        <Link
          key={area.href}
          href={area.href}
          aria-current={area.href === current ? "page" : undefined}
          className={`border-b-2 pb-1 text-[12px] font-semibold uppercase tracking-[0.16em] ${
            area.href === current ? "border-cyan text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {area.label}
        </Link>
      ))}
    </nav>
  );
}
