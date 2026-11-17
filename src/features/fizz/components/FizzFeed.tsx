import { connection } from "next/server";
import { formatWhen } from "@/lib/format";
import { loadFizzCatalog, type FizzPost } from "../data";

function metric(label: string, value: number | null) {
  if (value == null) return null;
  return (
    <span key={label}>
      {value.toLocaleString()} {label}
    </span>
  );
}

function PostCard({ post }: { post: FizzPost }) {
  const metrics = [
    metric("up", post.score),
    metric(post.commentCount === 1 ? "comment" : "comments", post.commentCount),
    metric(post.refizzCount === 1 ? "refizz" : "refizzes", post.refizzCount),
    metric(post.shareCount === 1 ? "share" : "shares", post.shareCount),
  ].filter(Boolean);

  return (
    <article className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm text-zinc-500">
        <span className="font-medium text-[#00356b]">{post.authorLabel ?? post.community ?? "Yale"}</span>
        <time dateTime={post.firstSeenAt}>
          {post.displayedAge ? `${post.displayedAge} · ` : ""}
          {formatWhen(post.firstSeenAt)}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-6 text-zinc-900">{post.body}</p>
      {metrics.length > 0 ? (
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-500">{metrics}</p>
      ) : null}
    </article>
  );
}

export async function FizzFeed({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const { q: query = "" } = await searchParams;
  let catalog: ReturnType<typeof loadFizzCatalog> | null = null;
  let error: string | null = null;
  try {
    catalog = loadFizzCatalog(query);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not open the Fizz catalog.";
  }

  return (
    <>
      {catalog ? (
        <p className="text-sm text-zinc-600">
          {catalog.postCount.toLocaleString()} posts
          {catalog.latestSeenAt ? ` · latest ${formatWhen(catalog.latestSeenAt)}` : ""}
        </p>
      ) : null}
      <form action="/" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search posts"
          className="h-11 flex-1 rounded-full border border-black/10 bg-white px-4 text-sm outline-none ring-[#00356b] focus:ring-2"
        />
        <button type="submit" className="h-11 rounded-full bg-[#00356b] px-5 text-sm font-medium text-white">
          Search
        </button>
      </form>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-700">{error}</p>
      ) : null}
      {catalog && catalog.posts.length === 0 ? (
        <p className="rounded-2xl border border-black/8 bg-white p-5 text-sm text-zinc-600">
          No posts match that search.
        </p>
      ) : null}
      {catalog?.posts.map((post) => (
        <PostCard key={post.postKey} post={post} />
      ))}
    </>
  );
}
