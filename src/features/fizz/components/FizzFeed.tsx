import { Icon, type IconName } from "@/components/Icon";
import { formatWhen } from "@/lib/format";
import { loadFizzCatalog, type FizzCatalog, type FizzPost } from "../data";

function metric(icon: IconName, label: string, value: number | null) {
  if (value == null) return null;
  return (
    <span key={label} className="inline-flex items-center gap-1.5">
      <Icon name={icon} size={16} /> {value.toLocaleString()} <span className="sr-only">{label}</span>
    </span>
  );
}

function PostCard({ post }: { post: FizzPost }) {
  const metrics = [
    metric("up", post.score === 1 ? "upvote" : "upvotes", post.score),
    metric("posts", post.commentCount === 1 ? "comment" : "comments", post.commentCount),
    metric("refresh", post.refizzCount === 1 ? "refizz" : "refizzes", post.refizzCount),
    metric("send", post.shareCount === 1 ? "share" : "shares", post.shareCount),
  ].filter(Boolean);
  const author = post.authorLabel ?? post.community ?? "Yale";

  return (
    <article className="px-4 py-4 sm:px-6">
      <header className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fbe9f2] text-[#a94377]"><Icon name="posts" size={19} /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold wrap-anywhere">{author}</p>
          <time dateTime={post.firstSeenAt} className="text-xs text-muted">{formatWhen(post.firstSeenAt)}</time>
        </div>
      </header>
      <div className="mt-3 sm:pl-[52px]">
        <p className="text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">{post.body}</p>
        {metrics.length > 0 && <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">{metrics}</p>}
      </div>
    </article>
  );
}

export async function FizzFeed({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query = "" } = await searchParams;
  let catalog: FizzCatalog | null = null;
  try {
    catalog = await loadFizzCatalog(query);
  } catch {
    // The archive is optional outside environments with a Fizz database.
  }

  return (
    <div className="flex flex-col gap-4">
      <form action="/posts" className="flex gap-2">
        <input name="q" type="search" aria-label="Search posts" defaultValue={query} placeholder="Search posts" className="field flex-1" />
        <button type="submit" className="primary-button"><Icon name="search" size={16} /> Search</button>
      </form>
      <div className="surface divide-y divide-line">
        {catalog ? (
          <>
            <p className="px-4 py-3 text-xs font-medium text-muted sm:px-6">{catalog.postCount.toLocaleString()} posts</p>
            {catalog.posts.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No posts match that search.</p>}
            {catalog.posts.map((post) => <PostCard key={post.postKey} post={post} />)}
          </>
        ) : <p className="px-4 py-8 text-center text-sm text-muted">The Fizz archive is unavailable right now.</p>}
      </div>
    </div>
  );
}
