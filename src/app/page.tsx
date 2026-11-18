import { Feed } from "@/features/feed";
import { getSession } from "@/lib/auth";
import { env, hasGoogle, hasMicrosoft } from "@/lib/env";
import { listItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  const items = await listItems({ userId: session?.user?.email ?? null });
  return (
    <Feed
      initialItems={items}
      initialTime={Date.now()}
      user={session?.user?.email ? { email: session.user.email, provider: session.provider ?? null } : null}
      config={{
        google: hasGoogle(),
        microsoft: hasMicrosoft(),
        yaleconnect: Boolean(env.yaleConnectIcalUrl),
      }}
    />
  );
}
