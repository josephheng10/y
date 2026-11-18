import { PageShell } from "@/components/PageShell";
import { InfoList } from "@/features/info";

export default function InfoPage() {
  return (
    <PageShell title="Campus info" lede="Guides for getting around Yale.">
      <InfoList />
    </PageShell>
  );
}
