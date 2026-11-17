import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { FizzFeed } from "@/features/fizz";

export const dynamic = "force-dynamic";

export default function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <PageShell
      current="/posts"
      title="Posts"
      lede="The local Fizz catalog. Tagged posts land on the wall through /api/ingest/fizz."
    >
      <Suspense fallback={<p className="text-sm text-neutral-400">Loading posts…</p>}>
        <FizzFeed searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
