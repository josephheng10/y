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
    <PageShell title="Posts" lede="Browse the Fizz archive.">
      <Suspense fallback={<p className="text-sm text-muted">Loading posts…</p>}>
        <FizzFeed searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
