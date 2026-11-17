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
    <article className="border border-white/10 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm text-neutral-500">
        <span className="font-medium text-cyan">{post.authorLabel ?? post.community ?? "Yale"}</span>
        <time dateTime={post.firstSeenAt}>
          {post.displayedAge ? `${post.displayedAge} · ` : ""}
          {formatWhen(post.firstSeenAt)}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-6 text-neutral-100">{post.body}</p>
      {metrics.length > 0 ? (
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-500">{metrics}</p>
      ) : null}
    </article>
  );
}

export async function FizzFeed({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query = "" } = await searchParams;
  let catalog: ReturnType<typeof loadFizzCatalog> | null = null;
  let error: string | null = null;
  try {
    catalog = loadFizzCatalog(query);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not open the Fizz catalog.";
  }

  return (
    <div className="flex flex-col gap-4">
      {catalog ? (
        <p className="text-sm text-neutral-400">
          {catalog.postCount.toLocaleString()} posts
          {catalog.latestSeenAt ? ` · latest ${formatWhen(catalog.latestSeenAt)}` : ""}
        </p>
      ) : null}
      <form action="/posts" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search posts"
          className="h-11 flex-1 border border-white/15 bg-transparent px-4 text-sm outline-none focus:border-cyan"
        />
        <button type="submit" className="h-11 border border-white bg-white px-5 text-sm font-medium text-black">
          Search
        </button>
      </form>
      {error ? (
        <p className="border border-red-400/40 px-4 py-4 text-sm text-red-300">{error}</p>
      ) : null}
      {catalog && catalog.posts.length === 0 ? (
        <p className="border border-white/10 px-4 py-8 text-sm text-neutral-400">
          No posts match that search.
        </p>
      ) : null}
      {catalog?.posts.map((post) => (
        <PostCard key={post.postKey} post={post} />
      ))}
    </div>
  );
}
