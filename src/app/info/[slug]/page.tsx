import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AreaNav } from "@/components/AreaNav";
import { getInfo, InfoDetail, listInfo } from "@/features/info";

export function generateStaticParams() {
  return listInfo().map((guide) => ({ slug: guide.slug }));
}

async function InfoBody({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getInfo(slug);
  if (!guide) notFound();
  return <InfoDetail guide={guide} />;
}

export default function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="min-h-full bg-[#f4f1ea] text-zinc-900">
      <AreaNav current="/info" />
      <main className="mx-auto w-full max-w-3xl px-5 py-6">
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading guide…</p>}>
          <InfoBody params={params} />
        </Suspense>
      </main>
    </div>
  );
}
