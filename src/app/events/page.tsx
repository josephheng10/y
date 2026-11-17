import { AreaNav } from "@/components/AreaNav";
import { EventList } from "@/features/events";

export default function EventsPage() {
  return (
    <div className="min-h-full bg-[#f4f1ea] text-zinc-900">
      <AreaNav current="/events" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <EventList />
      </main>
    </div>
  );
}
