import { researchQuestion } from "@/features/ask/research";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let message = "";
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === "string" ? body.message : "";
  } catch {
    return Response.json({ error: "Send a JSON body with a message." }, { status: 400 });
  }
  if (!message.trim()) {
    return Response.json({ error: "Ask a question first." }, { status: 400 });
  }
  try {
    return Response.json(await researchQuestion(message));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Research failed.";
    return Response.json({ error: detail }, { status: 500 });
  }
}
