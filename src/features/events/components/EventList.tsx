import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { listCampusEvents } from "../data";

export async function EventList() {
  const events = await listCampusEvents();
  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--border)] px-4 py-8 text-[14px] text-[var(--text-muted)]">
        No events in the hub yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {events.map((event) => (
        <article key={event.id} className="border-b border-[var(--border)] py-4">
          <p className="text-[13px] font-semibold text-[var(--accent)]">{event.source === "email" ? "Email" : event.source === "fizz" ? "Fixx" : event.source}</p>
          <h2 className="mt-1 text-[17px] font-bold leading-5">
            <Link href={`/events/${encodeURIComponent(event.id)}`} className="hover:underline">
              {event.title}
            </Link>
          </h2>
          {event.summary ? <p className="mt-2 text-[15px] leading-5 text-[var(--text-muted)]">{event.summary}</p> : null}
          <p className="mt-2 text-[13px] text-[var(--text-faint)]">
            {[event.starts_at ? formatWhen(event.starts_at) : null, event.location].filter(Boolean).join(" · ")}
          </p>
        </article>
      ))}
    </div>
  );
}
