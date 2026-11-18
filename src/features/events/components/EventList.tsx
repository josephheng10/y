import Link from "next/link";
import { Icon } from "@/components/Icon";
import { formatWhen } from "@/lib/format";
import { sourceLabel } from "@/lib/taste";
import { listCampusEvents } from "../data";

export async function EventList() {
  const events = await listCampusEvents();
  if (events.length === 0) {
    return <p className="surface px-5 py-10 text-center text-sm text-muted">No events on the calendar yet.</p>;
  }

  return (
    <div className="surface divide-y divide-line">
      {events.map((event) => (
        <article key={event.id}>
          <Link href={`/events/${encodeURIComponent(event.id)}`} className="group flex items-start gap-3 rounded-xl px-4 py-4 sm:px-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon name="calendar" size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">{sourceLabel(event.source)}{event.demo && " · Sample"}</p>
              <h2 className="mt-0.5 font-bold tracking-tight group-hover:text-accent">{event.title}</h2>
              {event.summary && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{event.summary}</p>}
              <p className="mt-2 text-xs font-medium text-muted">
                {[event.starts_at ? formatWhen(event.starts_at) : null, event.location].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="mt-2 shrink-0 text-muted group-hover:text-accent"><Icon name="arrow" size={16} /></span>
          </Link>
        </article>
      ))}
    </div>
  );
}
