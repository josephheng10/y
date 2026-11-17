import { AreaNav } from "@/components/AreaNav";
import { InfoList } from "@/features/info";

export default function InfoPage() {
  return (
    <div className="min-h-full bg-[#f4f1ea] text-zinc-900">
      <AreaNav current="/info" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Info</h1>
        <InfoList />
      </main>
    </div>
  );
}
