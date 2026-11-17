import type { FizzPost } from "@/lib/fizz";
import type { FizzInput } from "@/lib/ingest/fizz";

/** Shape a catalog post into the body accepted by /api/ingest/fizz. */
export function postToFizzInput(post: FizzPost): FizzInput {
  const title = post.body
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) ?? "Fizz post";
  return {
    external_id: post.postKey,
    title: title.slice(0, 140),
    text: post.body,
    source: "fizz",
    created_at: post.firstSeenAt,
    score: post.score == null ? undefined : Math.max(0, Math.min(100, Math.round(post.score))),
  };
}
