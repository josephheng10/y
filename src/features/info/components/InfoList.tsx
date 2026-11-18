import Link from "next/link";
import { listInfo } from "../data";

export function InfoList() {
  const guides = listInfo();

  return (
    <div className="flex flex-col">
      {guides.map((guide) => (
        <article key={guide.slug} className="border-b border-[var(--border)] py-4">
          <p className="text-[13px] font-semibold text-[var(--accent)]">{guide.category}</p>
          <h2 className="mt-1 text-[17px] font-bold leading-5">
            <Link href={`/info/${guide.slug}`} className="hover:underline">
              {guide.title}
            </Link>
          </h2>
          <p className="mt-2 text-[15px] leading-5 text-[var(--text-muted)]">{guide.summary}</p>
        </article>
      ))}
    </div>
  );
}
