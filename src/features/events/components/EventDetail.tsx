import Link from "next/link";
import { formatWhen } from "@/lib/format";
import type { CampusEvent } from "../types";

export function EventDetail({ event }: { event: CampusEvent }) {
  return (
    <article className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{event.host}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{event.title}</h1>
      <p className="mt-4 text-[15px] leading-6 text-zinc-800">{event.summary}</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">When</dt>
          <dd>
            {formatWhen(event.startsAt)} – {formatWhen(event.endsAt)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Where</dt>
          <dd>{event.location}</dd>
        </div>
      </dl>
      <p className="mt-6">
        <Link href="/events" className="text-sm font-medium text-[#00356b] hover:underline">
          All events
        </Link>
      </p>
    </article>
  );
}
