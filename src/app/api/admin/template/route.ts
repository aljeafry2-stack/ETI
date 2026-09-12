import { isAdmin } from "@/lib/auth";
import { buildTemplate } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  }
  const buffer = buildTemplate();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ETI-products-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
