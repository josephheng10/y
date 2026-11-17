import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EventDetail, getCampusEvent } from "@/features/events";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getCampusEvent(decodeURIComponent(id));
  if (!event) notFound();

  return (
    <PageShell current="/events" title="Events">
      <EventDetail event={event} />
    </PageShell>
  );
}
