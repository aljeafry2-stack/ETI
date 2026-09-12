import { createOrder, whatsappLink } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import type { Unit } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Body = {
  customer?: {
    customerName?: string;
    shopName?: string;
    phone?: string;
    city?: string;
    notes?: string;
  };
  lines?: { productId?: number; unit?: Unit; qty?: number }[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const customerName = (body.customer?.customerName ?? "").trim();
    if (!customerName) {
      return Response.json({ ok: false, error: "اسم العميل مطلوب" }, { status: 400 });
    }
    const lines = (body.lines ?? []).map((line) => ({
      productId: Number(line.productId),
      unit: (line.unit ?? "carton") as Unit,
      qty: Number(line.qty),
    }));
    if (lines.length === 0) {
      return Response.json({ ok: false, error: "السلة فارغة" }, { status: 400 });
    }

    const result = await createOrder(
      {
        customerName,
        shopName: (body.customer?.shopName ?? "").trim(),
        phone: (body.customer?.phone ?? "").trim(),
        city: (body.customer?.city ?? "").trim(),
        notes: (body.customer?.notes ?? "").trim(),
      },
      lines,
    );
    const settings = await getSettings();

    return Response.json({
      ok: true,
      orderId: result.order.id,
      orderNumber: result.orderNumber,
      whatsappText: result.whatsappText,
      whatsappUrl: whatsappLink(settings.companyWhatsapp, result.whatsappText),
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "خطأ غير متوقع" },
      { status: 400 },
    );
  }
}
