import Link from "next/link";
import type { CampusInfo } from "../types";

export function InfoDetail({ guide }: { guide: CampusInfo }) {
  return (
    <article className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#00356b]">{guide.category}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{guide.title}</h1>
      <p className="mt-4 text-[15px] leading-6 text-zinc-800">{guide.body}</p>
      <p className="mt-6">
        <Link href="/info" className="text-sm font-medium text-[#00356b] hover:underline">
          All info
        </Link>
      </p>
    </article>
  );
}
