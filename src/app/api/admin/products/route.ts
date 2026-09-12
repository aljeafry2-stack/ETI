import { db } from "@/db";
import { products, type NewProduct } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { num, round2 } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type ProductPayload = {
  id?: number;
  name?: string;
  category?: string;
  description?: string;
  sku?: string;
  packetsPerCarton?: number | string;
  piecesPerPacket?: number | string;
  cartonPrice?: number | string;
  packetPrice?: number | string;
  piecePrice?: number | string;
  retailPiecePrice?: number | string;
  stockCartons?: number | string;
  active?: boolean;
  imageUrl?: string | null;
  clearImage?: boolean;
};

function buildValues(payload: ProductPayload): Partial<NewProduct> {
  const values: Partial<NewProduct> = { updatedAt: new Date() };
  if (payload.name !== undefined) values.name = String(payload.name).trim();
  if (payload.category !== undefined) values.category = String(payload.category).trim() || "عام";
  if (payload.description !== undefined) values.description = String(payload.description).trim();
  if (payload.sku !== undefined) values.sku = String(payload.sku).trim() || null;
  if (payload.packetsPerCarton !== undefined)
    values.packetsPerCarton = Math.round(num(payload.packetsPerCarton));
  if (payload.piecesPerPacket !== undefined)
    values.piecesPerPacket = Math.round(num(payload.piecesPerPacket));
  if (payload.cartonPrice !== undefined) values.cartonPrice = round2(num(payload.cartonPrice));
  if (payload.packetPrice !== undefined) values.packetPrice = round2(num(payload.packetPrice));
  if (payload.piecePrice !== undefined) values.piecePrice = round2(num(payload.piecePrice));
  if (payload.retailPiecePrice !== undefined)
    values.retailPiecePrice = round2(num(payload.retailPiecePrice));
  if (payload.stockCartons !== undefined) values.stockCartons = round2(num(payload.stockCartons));
  if (payload.active !== undefined) values.active = Boolean(payload.active);
  if (payload.imageUrl !== undefined) values.imageUrl = payload.imageUrl ? String(payload.imageUrl) : null;
  if (payload.clearImage) {
    values.imageId = null;
    values.imageUrl = null;
  }
  return values;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const rows = await db.select().from(products).orderBy(products.category, products.sortOrder, products.id);
  return Response.json({
    ok: true,
    products: rows.map((row) => ({
      ...row,
      image: row.imageUrl && row.imageUrl !== "" ? row.imageUrl : row.imageId ? `/api/images/${row.imageId}` : null,
    })),
  });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const payload = (await request.json()) as ProductPayload;
    if (!payload.name || !String(payload.name).trim()) {
      return Response.json({ ok: false, error: "اسم المادة مطلوب" }, { status: 400 });
    }
    const [created] = await db
      .insert(products)
      .values({ ...buildValues(payload), name: String(payload.name).trim() })
      .returning();
    return Response.json({ ok: true, product: created });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const payload = (await request.json()) as ProductPayload;
    const id = Number(payload.id);
    if (!Number.isFinite(id)) {
      return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
    }
    const [updated] = await db
      .update(products)
      .set(buildValues(payload))
      .where(eq(products.id, id))
      .returning();
    if (!updated) return Response.json({ ok: false, error: "الصنف غير موجود" }, { status: 404 });
    return Response.json({ ok: true, product: updated });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("all") === "1") {
      await db.delete(products);
      return Response.json({ ok: true });
    }
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) {
      return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
    }
    await db.delete(products).where(eq(products.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 400 },
    );
  }
}
