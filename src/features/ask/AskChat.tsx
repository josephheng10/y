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
            onClick={() => ask(starter)}
            className="self-start border border-white/15 px-4 py-3 text-left text-sm text-neutral-200"
          >
            {starter}
          </button>
        ) : null}
        {turns.map((turn, index) => (
          <article
            key={`${turn.role}-${index}`}
            className={
              turn.role === "user"
                ? "self-end max-w-[90%] bg-white px-4 py-3 text-sm text-black"
                : "border border-white/10 px-4 py-3 text-sm leading-6 text-neutral-100"
            }
          >
            <p className="whitespace-pre-wrap">{turn.text}</p>
            {turn.sources && turn.sources.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                {turn.sources.map((source) => (
                  <li key={`${source.kind}-${source.href}-${source.excerpt}`}>
                    <Link href={source.href} className="font-medium text-cyan">
                      {source.kind === "post" ? "Post" : source.kind === "event" ? "Event" : "Info"} · {source.title}
                    </Link>
                    {source.when ? <span className="mt-0.5 block text-xs text-neutral-500">{source.when}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
        {pending ? <p className="text-sm text-neutral-500">Searching the catalog…</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
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
          className="h-11 flex-1 border border-white/15 bg-transparent px-4 text-sm outline-none focus:border-cyan"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 border border-white bg-white px-5 text-sm font-medium text-black disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
