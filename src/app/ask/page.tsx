import { PageShell } from "@/components/PageShell";
import { AskChat } from "@/features/ask";

export default function AskPage() {
  return (
    <PageShell
      current="/ask"
      title="Ask"
      lede="Ask about campus plans. Y searches the Fizz catalog, events, and info pages."
    >
      <AskChat />
    </PageShell>
  );
}
