import type { ReactNode } from "react";
import Link from "next/link";

export const areas = [
  { href: "/", label: "Posts" },
  { href: "/events", label: "Events" },
  { href: "/info", label: "Info" },
] as const;

export function AreaNav({
  current,
  aside,
}: {
  current: (typeof areas)[number]["href"];
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-black/8 bg-[#00356b] text-white">
      <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-6 px-5 py-6">
        <div>
          <Link href="/" className="text-4xl font-semibold tracking-tight">
            Y
          </Link>
          <nav className="mt-4 flex gap-4 text-sm">
            {areas.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                aria-current={area.href === current ? "page" : undefined}
                className={area.href === current ? "font-medium" : "text-white/80 hover:text-white"}
              >
                {area.label}
              </Link>
            ))}
          </nav>
        </div>
        {aside ? <div className="text-right text-sm text-white/80">{aside}</div> : null}
      </div>
    </header>
  );
}
