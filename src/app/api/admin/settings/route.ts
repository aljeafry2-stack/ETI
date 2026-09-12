import { requireAdmin } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, string | undefined>;
    await saveSettings({
      companyName: body.companyName,
      companyWhatsapp: (body.companyWhatsapp ?? "").replace(/\s/g, ""),
      currency: body.currency,
      invoiceNote: body.invoiceNote,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 400 },
    );
  }
}
