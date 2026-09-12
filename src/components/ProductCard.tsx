"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import type { ProductDTO } from "@/lib/dto";
import {
  UNIT_LABEL,
  availableQty,
  formatMoney,
  packSummary,
  piecesPerUnit,
  unitCost,
  unitProfit,
  unitRetail,
  type Unit,
} from "@/lib/pricing";

function ProductImage({ product }: { product: ProductDTO }) {
  const [failed, setFailed] = useState(false);
  const showImage = product.image && !failed;
  return (
    <div className="relative aspect-4/3 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image as string}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-emerald-100 to-teal-200">
          <span className="text-4xl font-black text-emerald-700/60">
            {product.name.trim().charAt(0) || "؟"}
          </span>
        </div>
      )}
      <span className="absolute end-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow">
        {product.category}
      </span>
    </div>
  );
}

export function ProductCard({ product, currency }: { product: ProductDTO; currency: string }) {
  const { add } = useCart();
  const [flash, setFlash] = useState<string | null>(null);

  const rows: { unit: Unit; label: string; sub: string }[] = [];
  if (product.stockCartons > 0) {
    if (product.packetsPerCarton > 0) {
      rows.push({
        unit: "carton",
        label: "الكرتون",
        sub: `${product.packetsPerCarton} باكيت • ${piecesPerUnit(product, "carton")} حبة`,
      });
    }
    if (product.piecesPerPacket > 0) {
      rows.push({
        unit: "packet",
        label: "الباكيت",
        sub: `${product.piecesPerPacket} حبة داخل الباكيت`,
      });
    }
    rows.push({ unit: "piece", label: "الحبة", sub: "أقل وحدة بيع" });
  }

  const handleAdd = (unit: Unit) => {
    add(product, unit, 1);
    setFlash(`تمت إضافة ${UNIT_LABEL[unit]} إلى السلة`);
    window.setTimeout(() => setFlash(null), 1600);
  };

  const cartonProfit = unitProfit(product, "carton");

  return (
    <article className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <ProductImage product={product} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg font-bold leading-tight text-slate-900">{product.name}</h3>
          {product.sku ? (
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">كود: {product.sku}</p>
          ) : null}
        </div>

        {product.description ? (
          <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
        ) : null}

        <p className="rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-500">
          {packSummary(product) || "لم تُحدد طريقة التعبئة"}
        </p>

        <div className="grid gap-2">
          {rows.map((row) => {
            const cost = unitCost(product, row.unit);
            const retail = unitRetail(product, row.unit);
            const profit = unitProfit(product, row.unit);
            return (
              <div
                key={row.unit}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">
                    {row.label}{" "}
                    <span className="font-extrabold text-emerald-700">
                      {formatMoney(cost, currency)}
                    </span>
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{row.sub}</p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-[11px] text-slate-500">بيع المحل</p>
                  <p className="text-[13px] font-bold text-slate-800">
                    {retail > 0 ? formatMoney(retail, currency) : "—"}
                  </p>
                  {profit > 0 ? (
                    <p className="text-[11px] font-bold text-emerald-600">
                      ربح {formatMoney(profit, currency)}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
              متوفر: {availableQty(product, "carton")} كرتون
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700">
              ربح الكرتون {formatMoney(cartonProfit, currency)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleAdd("carton")}
              className="rounded-xl bg-emerald-600 px-2 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              + كرتون
            </button>
            <button
              type="button"
              onClick={() => handleAdd("packet")}
              className="rounded-xl bg-teal-600 px-2 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
            >
              + باكيت
            </button>
            <button
              type="button"
              onClick={() => handleAdd("piece")}
              className="rounded-xl border border-emerald-600 px-2 py-2.5 text-[13px] font-bold text-emerald-700 transition hover:bg-emerald-50 active:scale-95"
            >
              + حبة
            </button>
          </div>
        </div>
      </div>

      {flash ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl bg-slate-900/90 px-3 py-2 text-center text-[12px] font-bold text-white">
          {flash}
        </div>
      ) : null}
    </article>
  );
}
