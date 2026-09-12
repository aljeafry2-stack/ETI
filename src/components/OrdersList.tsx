"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/pricing";

type OrderSummary = {
  id: number;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  totalCost: number;
  totalProfit: number;
  createdAt: string;
};

export function OrdersList({ currency }: { currency: string }) {
  const { orderIds, ready } = useCart();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (orderIds.length === 0) {
          setOrders([]);
        } else {
          const response = await fetch("/api/orders/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: orderIds }),
          });
          const data = (await response.json()) as { ok: boolean; orders?: OrderSummary[] };
          if (!cancelled && data.ok && data.orders) setOrders(data.orders);
        }
      } catch {
        /* تجاهل */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [orderIds, ready]);

  if (!ready || loading) {
    return <div className="rounded-3xl bg-white p-8 text-center text-slate-500">جارٍ التحميل…</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-2xl">📄</p>
        <p className="mt-2 text-lg font-bold text-slate-800">لا توجد طلبات محفوظة على هذا الجهاز</p>
        <p className="mt-1 text-sm text-slate-500">الطلبات تُحفظ في هذا المتصفح بعد إرسال الفاتورة.</p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          ابدأ طلباً جديداً
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/order/${order.id}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow"
        >
          <div>
            <p className="text-[15px] font-black text-slate-900">{order.orderNumber}</p>
            <p className="text-[12px] text-slate-500">
              {new Date(order.createdAt).toLocaleString("ar-EG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              • {order.itemCount} صنف
            </p>
          </div>
          <div className="text-end">
            <p className="text-[15px] font-black text-slate-900">
              {formatMoney(order.totalCost, currency)}
            </p>
            <p className="text-[12px] font-bold text-emerald-600">
              ربح {formatMoney(order.totalProfit, currency)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
