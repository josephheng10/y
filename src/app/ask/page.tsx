import { PageShell } from "@/components/PageShell";
import { AskChat } from "@/features/ask";

export default function AskPage() {
  return (
    <PageShell
      current="/ask"
      title="Ask"
      lede="Ask about campus plans. Y answers from the Fixx summary mock feed, demo events, and info pages — no API keys required."
    >
      <AskChat />
    </PageShell>
  );
}
