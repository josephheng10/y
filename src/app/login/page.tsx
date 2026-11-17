import { AuthScreen } from "@/components/AuthScreen";
import { getSession, safeCallbackUrl } from "@/lib/auth";
import { hasGoogle, hasMicrosoft } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  return (
    <AuthScreen
      mode="login"
      callbackUrl={safeCallbackUrl(first(query.callbackUrl))}
      initialError={first(query.error)}
      session={session?.user?.email ? { email: session.user.email, name: session.user.name ?? null } : null}
      providers={{ google: hasGoogle(), microsoft: hasMicrosoft() }}
    />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
