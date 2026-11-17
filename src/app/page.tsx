import { Feed } from "@/features/feed";
import { getSession } from "@/lib/auth";
import { env, hasGoogle, hasLLM, hasMicrosoft, seedDemo } from "@/lib/env";
import { listItems, storeKind } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  const items = await listItems({ userId: session?.user?.email ?? null });
  return (
    <Feed
      initialItems={items}
      user={session?.user?.email ? { email: session.user.email, provider: session.provider ?? null } : null}
      config={{
        google: hasGoogle(),
        microsoft: hasMicrosoft(),
        yaleconnect: Boolean(env.yaleConnectIcalUrl),
        llm: hasLLM(),
        store: storeKind(),
        demo: seedDemo(),
      }}
    />
  );
}
