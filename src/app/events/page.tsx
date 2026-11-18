import { PageShell } from "@/components/PageShell";
import { EventList } from "@/features/events";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <PageShell title="Events">
      <EventList />
    </PageShell>
  );
}
