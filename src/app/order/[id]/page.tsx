import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getOrderWithItems } from "@/lib/orders";
import { UNIT_LABEL, formatMoney, formatQty, piecesPerUnit, round2 } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const [data, settings] = await Promise.all([getOrderWithItems(orderId), getSettings()]);
  if (!data) notFound();

  const { order, items } = data;
  const currency = settings.currency;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      {sent === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          ✅ تم تسجيل الطلب برقم <span className="font-black">{order.orderNumber}</span>. اضغط الزر
          الأخضر بالأسفل لإرسال الفاتورة إلى واتساب الشركة.
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              {settings.companyName}
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">فاتورة طلب</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">{order.orderNumber}</p>
          </div>
          <div className="text-end text-[13px] text-slate-600">
            <p>
              <span className="font-bold text-slate-800">العميل:</span> {order.customerName}
            </p>
            {order.shopName ? (
              <p>
                <span className="font-bold text-slate-800">المحل:</span> {order.shopName}
              </p>
            ) : null}
            {order.phone ? (
              <p>
                <span className="font-bold text-slate-800">الجوال:</span> {order.phone}
              </p>
            ) : null}
            {order.city ? (
              <p>
                <span className="font-bold text-slate-800">المدينة:</span> {order.city}
              </p>
            ) : null}
            <p>
              {new Date(order.createdAt).toLocaleString("ar-EG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </header>

        <div className="overflow-x-auto py-4">
          <table className="w-full min-w-[620px] text-start text-[13px]">
            <thead>
              <tr className="text-slate-500">
                <th className="p-2 text-start font-bold">المادة</th>
                <th className="p-2 text-start font-bold">الصنف</th>
                <th className="p-2 text-start font-bold">الكمية</th>
                <th className="p-2 text-start font-bold">سعر الوحدة</th>
                <th className="p-2 text-start font-bold">الإجمالي</th>
                <th className="p-2 text-start font-bold">ربح العميل</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-2 font-bold text-slate-900">{item.name}</td>
                  <td className="p-2 text-slate-600">{item.category}</td>
                  <td className="p-2 text-slate-700">
                    {formatQty(item.qty)} {UNIT_LABEL[item.unit as "carton" | "packet" | "piece"]}
                    {piecesPerUnit(item, item.unit as "carton" | "packet" | "piece") > 1
                      ? ` (${formatQty(
                          piecesPerUnit(item, item.unit as "carton" | "packet" | "piece") * item.qty,
                        )} حبة)`
                      : ""}
                  </td>
                  <td className="p-2 text-slate-700">{formatMoney(item.unitPrice, currency)}</td>
                  <td className="p-2 font-black text-slate-900">
                    {formatMoney(item.lineCost, currency)}
                  </td>
                  <td className="p-2 font-bold text-emerald-600">
                    {formatMoney(item.lineProfit, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-1.5 border-t border-dashed border-slate-200 pt-4 text-[14px] sm:w-72 sm:ms-auto">
          <div className="flex justify-between">
            <span className="text-slate-600">إجمالي الفاتورة</span>
            <span className="font-black text-slate-900">{formatMoney(order.totalCost, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">البيع المتوقع بالمحل</span>
            <span className="font-bold text-slate-800">
              {formatMoney(order.totalRetail ?? round2(order.totalCost + order.totalProfit), currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-emerald-700">ربح العميل</span>
            <span className="font-black text-emerald-700">
              {formatMoney(order.totalProfit, currency)}
            </span>
          </div>
        </div>

        {order.notes ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[13px] text-slate-600">
            ملاحظات: {order.notes}
          </p>
        ) : null}
      </section>

      <WhatsAppButton number={settings.companyWhatsapp} text={order.whatsappText} />

      <div className="flex flex-wrap gap-3 text-[13px] font-bold">
        <Link href="/" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white">
          طلب أصناف أخرى
        </Link>
        <Link href="/orders" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700">
          كل طلباتي
        </Link>
      </div>
    </div>
  );
}
