import { listItems } from "@/lib/store";
import type { Item } from "@/lib/types";

export async function listCampusEvents(): Promise<Item[]> {
  const items = await listItems();
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (item.category !== "Event" && item.source !== "yaleconnect") return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => (a.starts_at ?? "9999").localeCompare(b.starts_at ?? "9999"));
}

export async function getCampusEvent(id: string): Promise<Item | undefined> {
  const events = await listCampusEvents();
  return events.find((event) => event.id === id);
}
