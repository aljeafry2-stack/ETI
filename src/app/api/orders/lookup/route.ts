import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
      : [];
    if (ids.length === 0) return Response.json({ ok: true, orders: [] });

    const rows = await db
      .select()
      .from(orders)
      .where(inArray(orders.id, ids.slice(0, 30)))
      .orderBy(desc(orders.id));

    return Response.json({ ok: true, orders: rows });
  } catch {
    return Response.json({ ok: false, orders: [] }, { status: 400 });
  }
}
