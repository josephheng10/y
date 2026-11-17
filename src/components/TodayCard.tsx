"use client";

import type { Item } from "@/lib/types";
import ItemCard from "./ItemCard";

export default function TodayCard({
  items,
  onOpen,
}: {
  items: Item[];
  onOpen: (item: Item) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Next few hours</h2>
        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">{items.length}</span>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:-mx-0 sm:px-0">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} layout="rail" onOpen={() => onOpen(item)} />
        ))}
      </div>
    </section>
  );
}
