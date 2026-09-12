import { db } from "@/db";
import { images, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const form = await request.formData();
    const productId = Number(form.get("productId"));
    if (!Number.isFinite(productId)) {
      return Response.json({ ok: false, error: "معرّف الصنف غير صالح" }, { status: 400 });
    }

    const url = form.get("url");
    if (typeof url === "string" && url.trim() !== "") {
      await db
        .update(products)
        .set({ imageUrl: url.trim(), imageId: null, updatedAt: new Date() })
        .where(eq(products.id, productId));
      return Response.json({ ok: true, src: url.trim() });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "اختر صورة" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return Response.json({ ok: false, error: "الملف ليس صورة" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ ok: false, error: "حجم الصورة أكبر من 6 ميجابايت" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const [image] = await db
      .insert(images)
      .values({ mimeType: file.type, data: buffer.toString("base64") })
      .returning({ id: images.id });

    await db
      .update(products)
      .set({ imageId: image.id, imageUrl: null, updatedAt: new Date() })
      .where(eq(products.id, productId));

    return Response.json({ ok: true, src: `/api/images/${image.id}` });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "فشل رفع الصورة" },
      { status: 400 },
    );
  }
}
