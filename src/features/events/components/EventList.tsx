import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { listEvents } from "../data";

export function EventList() {
  const events = listEvents();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600">
        Sample listings. This folder is the home for the events source and UI.
      </p>
      {events.map((event) => (
        <article key={event.id} className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{formatWhen(event.startsAt)}</p>
          <h2 className="mt-1 text-lg font-semibold">
            <Link href={`/events/${event.id}`} className="hover:underline">
              {event.title}
            </Link>
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-zinc-700">{event.summary}</p>
          <p className="mt-3 text-sm text-zinc-500">
            {event.location} · {event.host}
          </p>
        </article>
      ))}
    </div>
  );
}
