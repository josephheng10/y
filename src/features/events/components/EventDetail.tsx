import Link from "next/link";
import { Icon } from "@/components/Icon";
import { formatWhen } from "@/lib/format";
import { sourceLabel } from "@/lib/taste";
import type { Item } from "@/lib/types";

export function EventDetail({ event }: { event: Item }) {
  return (
    <article>
      <Link href="/events" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
        <Icon name="back" size={17} /> All events
      </Link>
      <div className="surface p-5 sm:p-6">
        <p className="text-sm font-semibold text-accent">{sourceLabel(event.source)}{event.demo && " · Sample"}</p>
        <h1 className="page-title mt-1.5">{event.title}</h1>
        {event.summary && <p className="mt-3 text-sm leading-relaxed text-muted">{event.summary}</p>}
        {(event.starts_at || event.location) && (
          <dl className="mt-5 grid gap-3 text-sm">
            {event.starts_at && (
              <div>
                <dt className="font-semibold">When</dt>
                <dd className="mt-0.5 text-muted">{formatWhen(event.starts_at)}</dd>
              </div>
            )}
            {event.location && (
              <div>
                <dt className="font-semibold">Where</dt>
                <dd className="mt-0.5 text-muted">{event.location}</dd>
              </div>
            )}
          </dl>
        )}
        {event.url && <a href={event.url} className="primary-button mt-5"><Icon name="external" size={16} /> View original</a>}
      </div>
    </article>
  );
}
