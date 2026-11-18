import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { sourceLabel } from "@/lib/taste";
import type { Item } from "@/lib/types";

export function EventDetail({ event }: { event: Item }) {
  return (
    <article className="border border-white/10 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">{sourceLabel(event.source)}</p>
      <h2 className="mt-2 font-display text-5xl leading-none">{event.title}</h2>
      {event.summary ? <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-300">{event.summary}</p> : null}
      <dl className="mt-6 grid gap-3 text-sm">
        {event.starts_at ? (
          <div>
            <dt className="text-neutral-500">When</dt>
            <dd>{formatWhen(event.starts_at)}</dd>
          </div>
        ) : null}
        {event.location ? (
          <div>
            <dt className="text-neutral-500">Where</dt>
            <dd>{event.location}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-6 flex gap-4 text-sm">
        <Link href="/events" className="text-cyan hover:underline">
          All events
        </Link>
        {event.url ? (
          <a href={event.url} className="text-cyan hover:underline">
            Source
          </a>
        ) : null}
      </p>
    </article>
  );
}
