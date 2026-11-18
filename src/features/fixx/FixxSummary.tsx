"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { FeedSkeleton } from "@/components/Skeleton";
import { FixxChat } from "./FixxChat";
import { listFixxPosts, type FixxPost } from "./mock";

function PostCard({ post }: { post: FixxPost }) {
  return (
    <article className="border-b border-[var(--border)] px-1 py-4">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-[var(--text-muted)]">
        <span className="font-bold text-[var(--text)]">{post.author}</span>
        <span>·</span>
        <span>{post.community}</span>
        <span>·</span>
        <time>{post.age}</time>
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-5 text-[var(--text)]">{post.body}</p>
      <p className="mt-3 flex flex-wrap gap-x-4 text-[13px] text-[var(--text-muted)]">
        <span>{post.ups.toLocaleString()} ups</span>
        <span>
          {post.comments} {post.comments === 1 ? "comment" : "comments"}
        </span>
      </p>
    </article>
  );
}

export function FixxSummary({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 350);
    return () => clearTimeout(t);
  }, []);

  const posts = useMemo(() => listFixxPosts(query), [query]);

  if (booting) return <FeedSkeleton rows={3} />;

  return (
    <div className="flex flex-col gap-5">
      <FixxChat />
      <div>
        <p className="text-[13px] text-[var(--text-muted)]">
          {posts.length} mock posts · Fixx summary (not live Fizz)
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const next = String(data.get("q") ?? "");
            startTransition(() => setQuery(next));
          }}
        >
          <input
            name="q"
            defaultValue={query}
            placeholder="Search Fixx summary"
            className="h-10 flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 text-[14px] outline-none focus:border-[var(--accent)]"
          />
          <button type="submit" className="h-10 rounded-full bg-[var(--text)] px-4 text-[14px] font-bold text-[var(--bg)]">
            Search
          </button>
        </form>
      </div>
      {pending ? <FeedSkeleton rows={2} /> : null}
      {!pending && posts.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] px-4 py-8 text-[14px] text-[var(--text-muted)]">
          No mock posts match that search.
        </p>
      ) : null}
      {!pending
        ? posts.map((post) => <PostCard key={post.id} post={post} />)
        : null}
    </div>
  );
}
