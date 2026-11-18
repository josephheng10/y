import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { ListSkeleton } from "@/components/Skeleton";
import { InfoList } from "@/features/info";

export default function InfoPage() {
  return (
    <PageShell
      current="/info"
      title="Info"
      lede="Guides that stay useful after the day they were posted. Sample copy until a real source is wired in."
    >
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <InfoList />
      </Suspense>
    </PageShell>
  );
}
