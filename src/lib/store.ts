/**
 * Storage layer.
 *  - If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set → Supabase `items` table.
 *  - Otherwise → in-memory store, persisted best-effort to .data/items.json
 *    (works locally; on Vercel it's per-instance memory only).
 * Demo items are merged in at read time (never written), unless SEED_DEMO=false.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { getDemoItems } from "./demo-data";
import { env, hasSupabase, seedDemo } from "./env";
import type { Category, Item, Source } from "./types";

export interface ListOptions {
  userId?: string | null;
  category?: Category;
  source?: Source;
  limit?: number;
}

interface Store {
  upsert(items: Item[]): Promise<number>;
  list(opts: ListOptions): Promise<Item[]>;
}

// ---------- Supabase ----------
let sb: SupabaseClient | null = null;
function supabase() {
  if (!sb) sb = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
  return sb;
}

const supabaseStore: Store = {
  async upsert(items) {
    if (!items.length) return 0;
    const rows = items.map(({ demo: _demo, ...r }) => r);
    const { error } = await supabase().from("items").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    return rows.length;
  },
  async list({ userId, category, source, limit = 200 }) {
    let q = supabase().from("items").select("*").order("created_at", { ascending: false }).limit(limit);
    // Shared items (user_id null) + this user's private items.
    q = userId ? q.or(`user_id.is.null,user_id.eq.${userId}`) : q.is("user_id", null);
    if (category) q = q.eq("category", category);
    if (source) q = q.eq("source", source);
    const { data, error } = await q;
    if (error) throw new Error(`Supabase select failed: ${error.message}`);
    return (data ?? []) as Item[];
  },
};

// ---------- In-memory / JSON file ----------
const DATA_FILE = path.join(process.cwd(), ".data", "items.json");
const g = globalThis as unknown as { __ysh_items?: Map<string, Item>; __ysh_loaded?: boolean };
const mem = (g.__ysh_items ??= new Map<string, Item>());

async function loadFile() {
  if (g.__ysh_loaded) return;
  g.__ysh_loaded = true;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    for (const it of JSON.parse(raw) as Item[]) mem.set(it.id, it);
  } catch {
    /* no file yet */
  }
}
async function saveFile() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([...mem.values()], null, 2));
  } catch {
    /* read-only FS (e.g. Vercel) — memory only */
  }
}

const memoryStore: Store = {
  async upsert(items) {
    await loadFile();
    for (const it of items) mem.set(it.id, { ...mem.get(it.id), ...it });
    await saveFile();
    return items.length;
  },
  async list({ userId, category, source, limit = 200 }) {
    await loadFile();
    return [...mem.values()]
      .filter((i) => i.user_id === null || (userId && i.user_id === userId))
      .filter((i) => !category || i.category === category)
      .filter((i) => !source || i.source === source)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  },
};

export const storeKind = () => (hasSupabase() ? "supabase" : "memory");
const store = (): Store => (hasSupabase() ? supabaseStore : memoryStore);

export async function upsertItems(items: Item[]) {
  return store().upsert(items);
}

export async function listItems(opts: ListOptions = {}): Promise<Item[]> {
  const real = await store().list(opts);
  if (!seedDemo()) return real;
  const demo = getDemoItems()
    .filter((i) => !opts.category || i.category === opts.category)
    .filter((i) => !opts.source || i.source === opts.source);
  const seen = new Set(real.map((r) => r.id));
  return [...real, ...demo.filter((d) => !seen.has(d.id))].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}
