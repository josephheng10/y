import { Suspense } from "react";
import { AreaNav } from "@/components/AreaNav";
import { FizzFeed } from "@/features/fizz";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div className="min-h-full bg-[#f4f1ea] text-zinc-900">
      <AreaNav current="/" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-6">
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading posts…</p>}>
          <FizzFeed searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
