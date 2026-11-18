import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { ListSkeleton } from "@/components/Skeleton";
import { EventList } from "@/features/events";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <PageShell
      current="/events"
      title="Events"
      lede="Campus events from the wall: anything tagged Event, plus YaleConnect."
    >
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <EventList />
      </Suspense>
    </PageShell>
  );
}
