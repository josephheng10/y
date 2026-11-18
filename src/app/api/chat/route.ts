import { researchQuestion } from "@/features/ask/research";
import { answerFixxQuestion } from "@/features/fixx/mock";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let message = "";
  let scope = "ask";
  try {
    const body = (await request.json()) as { message?: unknown; scope?: unknown };
    message = typeof body.message === "string" ? body.message : "";
    scope = typeof body.scope === "string" ? body.scope : "ask";
  } catch {
    return Response.json({ error: "Send a JSON body with a message." }, { status: 400 });
  }
  if (!message.trim()) {
    return Response.json({ error: "Ask a question first." }, { status: 400 });
  }
  try {
    if (scope === "fixx") {
      const result = answerFixxQuestion(message);
      return Response.json({
        answer: result.answer,
        sources: result.sources.map((source) => ({
          kind: "post" as const,
          title: source.title,
          excerpt: source.excerpt,
          href: source.href,
          when: null,
          id: source.id,
        })),
        asOf: "mock Fixx summary",
      });
    }
    return Response.json(await researchQuestion(message));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Research failed.";
    return Response.json({ error: detail }, { status: 500 });
  }
}
