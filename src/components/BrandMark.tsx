import Image from "next/image";
import Link from "next/link";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="Y home">
      <Image
        src="/y-logo.png"
        alt="Y"
        width={size}
        height={size}
        priority
        className="rounded-full"
      />
      <span className="text-[22px] font-bold tracking-tight text-[var(--text)]">Y</span>
    </Link>
  );
}
