import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const tables = [
  "posts", "comments", "metric_observations", "captures", "crawl_state",
  "discoveries", "poll_observations", "poll_options", "post_relations", "search_runs",
];

async function migrate() {
  const url = process.env.FIZZ_SUPABASE_URL;
  const key = process.env.FIZZ_SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Set FIZZ_SUPABASE_URL and FIZZ_SUPABASE_SECRET_KEY first.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const source = process.env.FIZZ_DB ?? path.resolve("..", "output", "fizz", "fizz.sqlite");
  const sqlite = new DatabaseSync(source, { readOnly: true });

  try {
    sqlite.exec("BEGIN");
    for (const name of tables) {
      const destination = client.from(`fizz_${name}`);
      const primaryKey = sqlite.prepare(`PRAGMA table_info(${name})`).all()
        .filter(({ pk }) => pk > 0)
        .sort((a, b) => a.pk - b.pk)
        .map(({ name }) => name)
        .join(",");
      if (!primaryKey) throw new Error(`Missing primary key for ${name}.`);
      const rows = sqlite.prepare(`SELECT * FROM ${name}`).all();

      // Import comments together so the deferred parent foreign key can resolve within the request.
      const batchSize = name === "comments" ? rows.length || 1 : 500;
      for (let offset = 0; offset < rows.length; offset += batchSize) {
        const { error } = await destination.upsert(rows.slice(offset, offset + batchSize), { onConflict: primaryKey });
        if (error) throw new Error(`Fizz ${name} import failed at row ${offset + 1} (${error.code}): ${error.message}`);
      }

      const { count, error } = await destination.select("*", { head: true, count: "exact" });
      if (error || count !== rows.length) {
        throw new Error(`Fizz ${name} verification failed: expected ${rows.length}, got ${count ?? error?.code}.`);
      }
      console.log(`${name}: ${count} rows verified`);
    }
  } finally {
    sqlite.close();
  }
}

migrate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
