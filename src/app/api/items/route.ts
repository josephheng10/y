import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { rankToday } from "@/lib/rank";
import { listItems, storeKind } from "@/lib/store";
import { isCategory, isSource } from "@/lib/types";
import { errorJson } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/items?category=Free%20food&source=fizz&limit=50 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const cat = sp.get("category");
    const src = sp.get("source");
    const session = await getSession();
    const items = await listItems({
      userId: session?.user?.email ?? null,
      category: isCategory(cat) ? cat : undefined,
      source: isSource(src) ? src : undefined,
      limit: Math.min(Number(sp.get("limit")) || 200, 500),
    });
    return NextResponse.json({
      store: storeKind(),
      count: items.length,
      today: rankToday(items),
      items,
    });
  } catch (e) {
    return errorJson(e);
  }
}
