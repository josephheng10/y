import { getDemoItems } from "@/lib/demo-data";
import type { Item } from "@/lib/types";
import { promises as fs } from "node:fs";
import path from "node:path";

export async function loadHubItems(): Promise<Item[]> {
  const items = getDemoItems();
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".data", "items.json"), "utf8");
    const saved = JSON.parse(raw) as Item[];
    if (Array.isArray(saved)) items.push(...saved);
  } catch {
    // No saved hub items yet.
  }
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
