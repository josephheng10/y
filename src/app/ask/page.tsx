import { PageShell } from "@/components/PageShell";
import { AskChat } from "@/features/ask";

export default function AskPage() {
  return (
    <PageShell
      current="/ask"
      title="Ask"
      lede="Ask about campus plans. Y reads posts, comments, and flyers, then writes a summary."
    >
      <AskChat />
    </PageShell>
  );
}
