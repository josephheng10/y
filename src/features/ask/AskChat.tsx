"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

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

const starter = "What parties are going on tonight?";

export function AskChat() {
  const [draft, setDraft] = useState("");
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
      const answer = payload.answer;
      setTurns((current) => [...current, { role: "assistant", text: answer, sources: payload.sources ?? [] }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The chatbot could not answer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="surface">
      <div className="flex min-h-65 flex-col gap-4 p-4 sm:p-6" role="log" aria-label="Conversation">
        {turns.length === 0 ? (
          <button
            type="button"
            onClick={() => ask(starter)}
            className="pill self-start text-left"
          >
            <Icon name="sparkles" size={16} /> {starter}
          </button>
        ) : null}
        {turns.map((turn, index) => (
          <article
            key={`${turn.role}-${index}`}
            className={
              turn.role === "user"
                ? "max-w-[90%] self-end rounded-[18px] rounded-br-sm bg-accent px-4 py-2.5 text-sm text-white"
                : "self-start rounded-[18px] rounded-bl-sm bg-canvas px-4 py-3 text-sm leading-relaxed"
            }
          >
            <p className="wrap-anywhere whitespace-pre-wrap">{turn.text}</p>
            {turn.sources && turn.sources.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                {turn.sources.map((source) => (
                  <li key={`${source.kind}-${source.href}-${source.excerpt}`}>
                    <Link href={source.href} className="font-semibold text-accent hover:underline">
                      {source.kind === "post" ? "Post" : source.kind === "event" ? "Event" : "Info"} · {source.title}
                    </Link>
                    {source.when ? <span className="mt-0.5 block text-xs text-muted">{source.when}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
        {pending && <p className="text-sm text-muted">Searching campus posts and events…</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
      <form
        className="flex items-center gap-2 border-t border-line p-3 sm:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about campus…"
          aria-label="Ask a question"
          className="field flex-1 rounded-full"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="primary-button min-h-11"
        >
          <Icon name="send" size={16} /> Send
        </button>
      </form>
    </div>
  );
}
