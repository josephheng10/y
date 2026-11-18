import { PageShell } from "@/components/PageShell";
import { FixxSummary } from "@/features/fixx";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return (
    <PageShell
      current="/posts"
      title="Fixx summary"
      lede="Mock campus chatter for demos — not a live Fizz connection. Ask the chatbot or browse the sample feed."
    >
      <FixxSummary initialQuery={q} />
    </PageShell>
  );
}
