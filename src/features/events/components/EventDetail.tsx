import Link from "next/link";
import { formatWhen } from "@/lib/format";
import type { Item } from "@/lib/types";

function sourceLabel(source: Item["source"]) {
  if (source === "email") return "Email";
  if (source === "fizz") return "Fixx";
  return source;
}

export function EventDetail({ event }: { event: Item }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] p-5">
      <p className="text-[13px] font-semibold text-[var(--accent)]">{sourceLabel(event.source)}</p>
      <h2 className="mt-2 text-[28px] font-extrabold tracking-tight leading-none">{event.title}</h2>
      {event.summary ? <p className="mt-4 max-w-xl text-[15px] leading-6 text-[var(--text-muted)]">{event.summary}</p> : null}
      <dl className="mt-6 grid gap-3 text-[14px]">
        {event.starts_at ? (
          <div>
            <dt className="text-[var(--text-muted)]">When</dt>
            <dd>{formatWhen(event.starts_at)}</dd>
          </div>
        ) : null}
        {event.location ? (
          <div>
            <dt className="text-[var(--text-muted)]">Where</dt>
            <dd>{event.location}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-6 flex gap-4 text-[14px]">
        <Link href="/events" className="font-semibold text-[var(--accent)] hover:underline">
          All events
        </Link>
        {event.url ? (
          <a href={event.url} className="font-semibold text-[var(--accent)] hover:underline">
            Source
          </a>
        ) : null}
      </p>
    </article>
  );
}
