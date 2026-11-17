import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getInfo, InfoDetail, listInfo } from "@/features/info";

export function generateStaticParams() {
  return listInfo().map((guide) => ({ slug: guide.slug }));
}

export default async function InfoGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getInfo(slug);
  if (!guide) notFound();

  return (
    <PageShell current="/info" title="Info">
      <InfoDetail guide={guide} />
    </PageShell>
  );
}
