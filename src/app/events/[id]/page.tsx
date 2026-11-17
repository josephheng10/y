import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AreaNav } from "@/components/AreaNav";
import { EventDetail, getEvent, listEvents } from "@/features/events";

export function generateStaticParams() {
  return listEvents().map((event) => ({ id: event.id }));
}

async function EventBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEvent(id);
  if (!event) notFound();
  return <EventDetail event={event} />;
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-full bg-[#f4f1ea] text-zinc-900">
      <AreaNav current="/events" />
      <main className="mx-auto w-full max-w-3xl px-5 py-6">
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading event…</p>}>
          <EventBody params={params} />
        </Suspense>
      </main>
    </div>
  );
}
