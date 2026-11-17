import { AuthScreen } from "@/components/AuthScreen";
import { getSession, safeCallbackUrl } from "@/lib/auth";
import { hasGoogle, hasMicrosoft } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  return (
    <AuthScreen
      mode="signup"
      callbackUrl={safeCallbackUrl(first(query.callbackUrl))}
      session={session?.user?.email ? { email: session.user.email, name: session.user.name ?? null } : null}
      providers={{ google: hasGoogle(), microsoft: hasMicrosoft() }}
    />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
