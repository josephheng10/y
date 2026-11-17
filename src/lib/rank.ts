/**
 * "Today at Yale" ranking: things starting within the next ~6 hours
 * (or started in the last 30 min), free food boosted, sooner = higher.
 */
import type { Item } from "./types";

export const TODAY_WINDOW_HOURS = 6;

export function rankToday(items: Item[], now = Date.now(), limit = 4): Item[] {
  const from = now - 30 * 60 * 1000;
  const to = now + TODAY_WINDOW_HOURS * 3600 * 1000;
  return items
    .filter((i) => i.category !== "Noise" && i.starts_at)
    .map((i) => ({ i, t: Date.parse(i.starts_at!) }))
    .filter(({ t }) => t >= from && t <= to)
    .map(({ i, t }) => {
      const hoursAway = Math.max(0, (t - now) / 3600000);
      const soon = 40 * (1 - hoursAway / TODAY_WINDOW_HOURS); // 0–40
      const food = i.category === "Free food" ? 30 : 0;
      return { i, s: i.score * 0.5 + soon + food };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ i }) => i);
}
