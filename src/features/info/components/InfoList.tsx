import Link from "next/link";
import { Icon } from "@/components/Icon";
import { listInfo } from "../data";

export function InfoList() {
  const guides = listInfo();

  return (
    <div className="surface divide-y divide-line">
      {guides.map((guide) => (
        <article key={guide.slug}>
          <Link href={`/info/${guide.slug}`} className="group flex items-start gap-3 rounded-xl px-4 py-4 sm:px-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon name="info" size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">{guide.category}</p>
              <h2 className="mt-0.5 font-bold tracking-tight group-hover:text-accent">{guide.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{guide.summary}</p>
            </div>
            <span className="mt-2 shrink-0 text-muted group-hover:text-accent"><Icon name="arrow" size={16} /></span>
          </Link>
        </article>
      ))}
    </div>
  );
}
