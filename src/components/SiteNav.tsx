"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon, type IconName } from "./Icon";

const areas: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Wall", icon: "wall" },
  { href: "/events", label: "Events", icon: "calendar" },
  { href: "/posts", label: "Posts", icon: "posts" },
  { href: "/info", label: "Info", icon: "info" },
  { href: "/ask", label: "Ask Y", icon: "sparkles" },
];

export function SiteHeader() {
  const { data, status } = useSession();
  const account = data?.user?.name || data?.user?.email;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Y home">
          <span className="brand-mark">Y</span>
          <span>Yale campus</span>
        </Link>
        {status === "authenticated" && account ? (
          <Link href="/login" className="account-link" aria-label={`Account for ${account}`}>
            <span className="account-avatar">{account.slice(0, 1).toUpperCase()}</span>
            <span className="max-w-40 truncate max-sm:hidden">{account}</span>
            <Icon name="chevron" size={15} />
          </Link>
        ) : (
          <Link href="/login" className="account-link"><Icon name="user" size={17} /> Sign in</Link>
        )}
      </div>
    </header>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="site-nav" aria-label="Main navigation">
      {areas.map(({ href, label, icon }) => (
        <Link key={href} href={href} className="site-nav-link"
          aria-current={pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "page" : undefined}>
          <span className="site-nav-icon"><Icon name={icon} /></span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
