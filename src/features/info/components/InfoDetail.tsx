import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { CampusInfo } from "../types";

export function InfoDetail({ guide }: { guide: CampusInfo }) {
  return (
    <article>
      <Link href="/info" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
        <Icon name="back" size={17} /> Campus info
      </Link>
      <div className="surface p-5 sm:p-6">
        <p className="text-sm font-semibold text-accent">{guide.category}</p>
        <h1 className="page-title mt-1.5">{guide.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{guide.body}</p>
      </div>
    </article>
  );
}
