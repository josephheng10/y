import Link from "next/link";
import { listInfo } from "../data";

export function InfoList() {
  const guides = listInfo();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600">
        Sample guides. This folder is the home for campus info that stays useful after the day it was posted.
      </p>
      {guides.map((guide) => (
        <article key={guide.slug} className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#00356b]">{guide.category}</p>
          <h2 className="mt-1 text-lg font-semibold">
            <Link href={`/info/${guide.slug}`} className="hover:underline">
              {guide.title}
            </Link>
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-zinc-700">{guide.summary}</p>
        </article>
      ))}
    </div>
  );
}
