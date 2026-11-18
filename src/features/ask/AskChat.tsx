"use client";

import { useState } from "react";
import Link from "next/link";

type Source = {
  kind: "post" | "event" | "info";
  title: string;
  excerpt: string;
  href: string;
  when: string | null;
};

type Turn = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
};

const starter = "what parties are going on tonight?";

export function AskChat() {
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
        body: JSON.stringify({ message }),
      });
      const payload = (await response.json()) as { answer?: string; sources?: Source[]; error?: string };
      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? "The chatbot could not answer.");
      }
      setTurns((current) => [...current, { role: "assistant", text: payload.answer!, sources: payload.sources ?? [] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The chatbot could not answer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-80 flex-col gap-3">
        {turns.length === 0 ? (
          <button
            type="button"
            onClick={() => void ask(starter)}
            className="self-start rounded-2xl border border-[var(--border)] px-4 py-3 text-left text-[15px] text-[var(--text)] hover:bg-[var(--hover)]"
          >
            {starter}
          </button>
        ) : null}
        {turns.map((turn, index) => (
          <article
            key={`${turn.role}-${index}`}
            className={
              turn.role === "user"
                ? "self-end max-w-[90%] rounded-2xl bg-[var(--text)] px-4 py-3 text-[15px] text-[var(--bg)]"
                : "rounded-2xl border border-[var(--border)] px-4 py-3 text-[15px] leading-6 text-[var(--text)]"
            }
          >
            <p className="whitespace-pre-wrap">{turn.text}</p>
            {turn.sources && turn.sources.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                {turn.sources.map((source) => (
                  <li key={`${source.kind}-${source.href}-${source.excerpt}`}>
                    <Link href={source.href} className="font-semibold text-[var(--accent)] hover:underline">
                      {source.kind === "post" ? "Fixx" : source.kind === "event" ? "Event" : "Info"} · {source.title}
                    </Link>
                    {source.when ? <span className="mt-0.5 block text-[13px] text-[var(--text-muted)]">{source.when}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
        {pending ? <p className="text-[14px] text-[var(--text-muted)]">Searching mock campus data…</p> : null}
        {error ? <p className="text-[14px] text-[var(--danger)]">{error}</p> : null}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about tonight, a club, dining…"
          className="h-11 flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 text-[15px] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-[var(--text)] px-5 text-[15px] font-bold text-[var(--bg)] disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
