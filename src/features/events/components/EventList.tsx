import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { listCampusEvents } from "../data";

export async function EventList() {
  const events = await listCampusEvents();
  if (events.length === 0) {
    return <p className="border border-white/10 px-4 py-8 text-sm text-neutral-400">No events in the hub yet.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {events.map((event) => (
        <article key={event.id} className="border border-white/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">{event.source}</p>
          <h2 className="mt-2 text-xl font-semibold">
            <Link href={`/events/${encodeURIComponent(event.id)}`} className="hover:underline">
              {event.title}
            </Link>
          </h2>
          {event.summary ? <p className="mt-2 text-sm leading-6 text-neutral-300">{event.summary}</p> : null}
          <p className="mt-3 text-sm text-neutral-500">
            {[event.starts_at ? formatWhen(event.starts_at) : null, event.location].filter(Boolean).join(" · ")}
          </p>
        </article>
      ))}
    </div>
  );
}
