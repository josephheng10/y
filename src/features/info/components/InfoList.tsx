import Link from "next/link";
import { listInfo } from "../data";

export function InfoList() {
  const guides = listInfo();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {guides.map((guide) => (
        <article key={guide.slug} className="border border-white/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">{guide.category}</p>
          <h2 className="mt-2 text-xl font-semibold">
            <Link href={`/info/${guide.slug}`} className="hover:underline">
              {guide.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-300">{guide.summary}</p>
        </article>
      ))}
    </div>
  );
}
