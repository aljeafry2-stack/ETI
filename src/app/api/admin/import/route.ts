import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { parseWorkbook } from "@/lib/excel";
import { normalizeSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

function keyOf(sku: string, name: string, category: string): string {
  const code = normalizeSearch(sku);
  if (code) return `sku:${code}`;
  return `n:${normalizeSearch(name)}|${normalizeSearch(category)}`;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "اختر ملف Excel أولاً" }, { status: 400 });
    }
    const mode = (form.get("mode") ?? "merge") === "replace" ? "replace" : "merge";
    const meaning = (form.get("piecePriceMeaning") ?? "retail") === "cost" ? "cost" : "retail";

    const buffer = await file.arrayBuffer();
    const parsed = parseWorkbook(buffer, { piecePriceMeaning: meaning });

    if (parsed.rows.length === 0) {
      return Response.json(
        { ok: false, error: "لم يتم العثور على صفوف صالحة في الملف" },
        { status: 400 },
      );
    }

    const existing = await db.select().from(products);
    const byKey = new Map(existing.map((row) => [keyOf(row.sku ?? "", row.name, row.category), row]));
    const matchedIds = new Set<number>();

    let created = 0;
    let updated = 0;

    for (const [index, row] of parsed.rows.entries()) {
      const key = keyOf(row.sku, row.name, row.category);
      const found = byKey.get(key);
      const values = {
        sku: row.sku || null,
        name: row.name,
        category: row.category || "عام",
        description: row.description,
        packetsPerCarton: row.packetsPerCarton,
        piecesPerPacket: row.piecesPerPacket,
        cartonPrice: row.cartonPrice,
        packetPrice: row.packetPrice,
        piecePrice: row.piecePrice,
        retailPiecePrice: row.retailPiecePrice,
        active: true,
        sortOrder: index + 1,
        updatedAt: new Date(),
      };

      if (found) {
        matchedIds.add(found.id);
        await db.update(products).set(values).where(eq(products.id, found.id));
        updated += 1;
      } else {
        const [inserted] = await db
          .insert(products)
          .values({ ...values, stockCartons: 0, imageUrl: null, imageId: null })
          .returning({ id: products.id });
        matchedIds.add(inserted.id);
        created += 1;
      }
    }

    let deactivated = 0;
    if (mode === "replace") {
      for (const row of existing) {
        if (matchedIds.has(row.id)) continue;
        await db
          .update(products)
          .set({ active: false, updatedAt: new Date() })
          .where(eq(products.id, row.id));
        deactivated += 1;
      }
    }

    return Response.json({
      ok: true,
      created,
      updated,
      deactivated,
      totalRows: parsed.rows.length,
      skipped: parsed.skipped,
      detectedColumns: parsed.detectedColumns,
      mapping: parsed.mapping,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "فشل قراءة الملف" },
      { status: 400 },
    );
  }
}
