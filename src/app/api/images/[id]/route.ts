import { db } from "@/db";
import { images } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const imageId = Number(id);
  if (!Number.isFinite(imageId)) return new Response("Not found", { status: 404 });

  const [row] = await db.select().from(images).where(eq(images.id, imageId)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  const bytes = Uint8Array.from(Buffer.from(row.data, "base64"));
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mimeType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
