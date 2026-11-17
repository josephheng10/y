import { NextResponse } from "next/server";
import { AccountExistsError, createUser, validateAccountInput } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send a name, email, and password." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Send a name, email, and password." }, { status: 400 });
  }
  const { name, email, password } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Send a name, email, and password." }, { status: 400 });
  }
  const problem = validateAccountInput({ name, email, password });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  try {
    const account = await createUser({ name, email, password });
    return NextResponse.json({ email: account.email, name: account.name }, { status: 201 });
  } catch (error) {
    if (error instanceof AccountExistsError) {
      return NextResponse.json({ error: "That email already has an account. Sign in instead." }, { status: 409 });
    }
    console.warn("[auth] signup error:", (error as Error).message);
    return NextResponse.json({ error: "Couldn't create the account." }, { status: 500 });
  }
}
