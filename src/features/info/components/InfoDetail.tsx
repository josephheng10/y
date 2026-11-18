import Link from "next/link";
import type { CampusInfo } from "../types";

export function InfoDetail({ guide }: { guide: CampusInfo }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] p-5">
      <p className="text-[13px] font-semibold text-[var(--accent)]">{guide.category}</p>
      <h2 className="mt-2 text-[28px] font-extrabold tracking-tight leading-none">{guide.title}</h2>
      <p className="mt-4 max-w-xl text-[15px] leading-6 text-[var(--text-muted)]">{guide.body}</p>
      <p className="mt-6">
        <Link href="/info" className="text-[14px] font-semibold text-[var(--accent)] hover:underline">
          All info
        </Link>
      </p>
    </article>
  );
}
