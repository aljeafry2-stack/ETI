"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { UNIT_LABEL, formatMoney, formatQty, piecesPerUnit } from "@/lib/pricing";

export function CartClient({ currency }: { currency: string }) {
  const router = useRouter();
  const { ready, items, totalCost, totalRetail, totalProfit, setQty, remove, clear, customer, saveCustomer, rememberOrder } =
    useCart();
  const [form, setForm] = useState(customer);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async () => {
    setError(null);
    if (items.length === 0) {
      setError("السلة فارغة — أضف أصنافاً أولاً.");
      return;
    }
    if (!form.customerName.trim()) {
      setError("اكتب اسمك أولاً حتى نعرف صاحب الطلب.");
      return;
    }
    setSubmitting(true);
    try {
      saveCustomer(form);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          lines: items.map((item) => ({
            productId: item.productId,
            unit: item.unit,
            qty: item.qty,
          })),
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        orderId?: number;
        whatsappUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.orderId) {
        throw new Error(data.error ?? "تعذّر إنشاء الفاتورة");
      }
      rememberOrder(data.orderId);
      clear();
      if (data.whatsappUrl) {
        const win = window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        if (!win) window.location.href = data.whatsappUrl;
      }
      router.push(`/order/${data.orderId}?sent=1`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "خطأ غير متوقع");
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <div className="rounded-3xl bg-white p-8 text-center text-slate-500">جارٍ التحميل…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-2xl">🧺</p>
        <p className="mt-2 text-lg font-bold text-slate-800">السلة فارغة</p>
        <p className="mt-1 text-sm text-slate-500">اختر الأصناف المطلوبة ثم ارجع هنا لإرسال الفاتورة.</p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          تصفح الأصناف
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-black text-slate-900">مراجعة الطلب</h1>
        {items.map((item) => {
          const pieces = piecesPerUnit(item, item.unit);
          return (
            <div
              key={item.key}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xl font-black text-emerald-700/50">
                    {item.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-[150px] flex-1">
                <p className="text-[15px] font-bold text-slate-900">{item.name}</p>
                <p className="text-[12px] text-slate-500">
                  {item.category} • {UNIT_LABEL[item.unit]}
                  {pieces > 1 ? ` • ${formatQty(pieces * item.qty)} حبة` : ""}
                </p>
                <p className="text-[12px] text-slate-500">
                  سعر الوحدة {formatMoney(item.unitPrice, currency)} — بيع المحل{" "}
                  {formatMoney(item.unitRetail, currency)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQty(item.key, item.qty - (item.unit === "piece" ? 1 : 1))}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-lg font-bold text-slate-700 hover:bg-slate-200"
                >
                  −
                </button>
                <input
                  value={formatQty(item.qty)}
                  onChange={(event) => setQty(item.key, Number(event.target.value.replace(/[^\d.]/g, "")) || 0)}
                  className="w-16 rounded-xl border border-slate-200 px-2 py-1.5 text-center text-sm font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setQty(item.key, item.qty + 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white hover:bg-emerald-700"
                >
                  +
                </button>
              </div>

              <div className="w-28 text-end">
                <p className="text-[15px] font-black text-slate-900">
                  {formatMoney(item.unitPrice * item.qty, currency)}
                </p>
                <p className="text-[12px] font-bold text-emerald-600">
                  ربح {formatMoney(item.unitProfit * item.qty, currency)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => remove(item.key)}
                className="rounded-xl px-2 py-1 text-[12px] font-bold text-rose-500 hover:bg-rose-50"
              >
                حذف
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={clear}
          className="self-start rounded-xl border border-rose-200 px-4 py-2 text-[13px] font-bold text-rose-600 hover:bg-rose-50"
        >
          تفريغ السلة
        </button>
      </section>

      <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:h-fit">
        <h2 className="text-lg font-black text-slate-900">بيانات الفاتورة</h2>

        <div className="grid gap-2.5">
          <label className="text-[13px] font-bold text-slate-700">
            اسم العميل <span className="text-rose-500">*</span>
            <input
              value={form.customerName}
              onChange={update("customerName")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
              placeholder="مثال: أحمد محمد"
            />
          </label>
          <label className="text-[13px] font-bold text-slate-700">
            اسم المحل
            <input
              value={form.shopName}
              onChange={update("shopName")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
              placeholder="مثال: بقالة النور"
            />
          </label>
          <label className="text-[13px] font-bold text-slate-700">
            رقم الجوال
            <input
              value={form.phone}
              onChange={update("phone")}
              inputMode="tel"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
              placeholder="01xxxxxxxxx"
            />
          </label>
          <label className="text-[13px] font-bold text-slate-700">
            المدينة / المنطقة
            <input
              value={form.city}
              onChange={update("city")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
              placeholder="مثال: القاهرة"
            />
          </label>
          <label className="text-[13px] font-bold text-slate-700">
            ملاحظات
            <textarea
              value={form.notes}
              onChange={update("notes")}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
              placeholder="وقت التوصيل المفضل…"
            />
          </label>
        </div>

        <div className="grid gap-1.5 rounded-2xl bg-slate-50 p-4 text-[13px]">
          <div className="flex justify-between">
            <span className="text-slate-600">عدد الأصناف</span>
            <span className="font-bold text-slate-900">{items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">إجمالي الفاتورة</span>
            <span className="font-black text-slate-900">{formatMoney(totalCost, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">البيع المتوقع بالمحل</span>
            <span className="font-bold text-slate-900">{formatMoney(totalRetail, currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span className="font-bold text-emerald-700">ربحك المتوقع</span>
            <span className="font-black text-emerald-700">{formatMoney(totalProfit, currency)}</span>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-bold text-rose-700">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-2xl bg-[#25D366] px-5 py-3.5 text-[15px] font-black text-white shadow-lg shadow-emerald-600/20 transition hover:brightness-95 disabled:opacity-60"
        >
          {submitting ? "جارٍ إنشاء الفاتورة…" : "إرسال الفاتورة عبر واتساب"}
        </button>
        <p className="text-center text-[11px] text-slate-500">
          سيتم فتح واتساب مع نص الفاتورة جاهزاً للإرسال لرقم الشركة.
        </p>
      </aside>
    </div>
  );
}
