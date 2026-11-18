"use client";

import Link from "next/link";
import { useState } from "react";

type Source = { id: string; title: string; excerpt: string; href: string };
type Turn = { role: "user" | "assistant"; text: string; sources?: Source[] };

const starter = "what's going on tonight on Fixx?";

export function FixxChat() {
  const [draft, setDraft] = useState(starter);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setDraft("");
    setError(null);
    setPending(true);
    setTurns((current) => [...current, { role: "user", text: message }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, scope: "fixx" }),
      });
      const payload = (await response.json()) as { answer?: string; sources?: Source[]; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error ?? "Could not answer.");
      setTurns((current) => [...current, { role: "assistant", text: payload.answer!, sources: payload.sources ?? [] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not answer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-[13px] font-semibold text-[var(--text)]">Ask Fixx</p>
      <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">Answers from the mock Fixx summary — no live feed required.</p>
      <div className="mt-3 flex min-h-40 flex-col gap-2">
        {turns.length === 0 ? (
          <button
            type="button"
            onClick={() => void ask(starter)}
            className="self-start rounded-full border border-[var(--border)] px-3 py-2 text-left text-[14px] text-[var(--text)] hover:bg-[var(--hover)]"
          >
            {starter}
          </button>
        ) : null}
        {turns.map((turn, index) => (
          <article
            key={`${turn.role}-${index}`}
            className={
              turn.role === "user"
                ? "self-end max-w-[90%] rounded-2xl bg-[var(--text)] px-3 py-2 text-[14px] text-[var(--bg)]"
                : "rounded-2xl border border-[var(--border)] px-3 py-2 text-[14px] leading-5 text-[var(--text)]"
            }
          >
            <p className="whitespace-pre-wrap">{turn.text}</p>
            {turn.sources && turn.sources.length > 0 ? (
              <ul className="mt-2 space-y-1 border-t border-[var(--border)] pt-2">
                {turn.sources.map((source) => (
                  <li key={source.id}>
                    <Link href={source.href} className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
                      {source.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
        {pending ? <p className="text-[13px] text-[var(--text-muted)]">Searching Fixx…</p> : null}
        {error ? <p className="text-[13px] text-[var(--danger)]">{error}</p> : null}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about Fixx chatter…"
          className="h-10 flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 text-[14px] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-[var(--text)] px-4 text-[14px] font-bold text-[var(--bg)] disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
