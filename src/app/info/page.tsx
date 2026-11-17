import { PageShell } from "@/components/PageShell";
import { InfoList } from "@/features/info";

export default function InfoPage() {
  return (
    <PageShell
      current="/info"
      title="Info"
      lede="Guides that stay useful after the day they were posted. Sample copy until a real source is wired in."
    >
      <InfoList />
    </PageShell>
  );
}
