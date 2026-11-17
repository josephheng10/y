import Link from "next/link";
import type { CampusInfo } from "../types";

export function InfoDetail({ guide }: { guide: CampusInfo }) {
  return (
    <article className="border border-white/10 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">{guide.category}</p>
      <h2 className="mt-2 font-display text-5xl leading-none">{guide.title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-300">{guide.body}</p>
      <p className="mt-6">
        <Link href="/info" className="text-sm text-cyan hover:underline">
          All info
        </Link>
      </p>
    </article>
  );
}
