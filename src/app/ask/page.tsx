import { PageShell } from "@/components/PageShell";
import { AskChat } from "@/features/ask";

export default function AskPage() {
  return (
    <PageShell title="Ask Y" lede="Find answers in campus posts, events, and guides.">
      <AskChat />
    </PageShell>
  );
}
