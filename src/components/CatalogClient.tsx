"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { ProductCard } from "@/components/ProductCard";
import type { ProductDTO } from "@/lib/dto";
import { formatMoney } from "@/lib/pricing";
import { normalizeSearch } from "@/lib/search";

export function CatalogClient({
  products,
  currency,
}: {
  products: ProductDTO[];
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const { totalCost, count, totalProfit } = useCart();

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.category.trim()) set.add(product.category.trim());
    }
    return ["الكل", ...Array.from(set).sort((a, b) => a.localeCompare(b, "ar"))];
  }, [products]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    return products.filter((product) => {
      if (category !== "الكل" && product.category !== category) return false;
      if (!needle) return true;
      return (
        normalizeSearch(product.name).includes(needle) ||
        normalizeSearch(product.category).includes(needle) ||
        normalizeSearch(product.description).includes(needle) ||
        normalizeSearch(product.sku ?? "").includes(needle)
      );
    });
  }, [products, query, category]);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-gradient-to-l from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-xl shadow-emerald-900/15 sm:p-8">
        <h1 className="text-2xl font-black sm:text-3xl">اطلب أصناف ETI بضغطة واحدة</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50">
          اختر الكرتون أو الباكيت أو الحبة لكل صنف، وشاهد ربحك المتوقع فوراً. عند الانتهاء تُرسل
          الفاتورة كاملة إلى واتساب الشركة.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-[13px] font-bold">
          <span className="rounded-2xl bg-white/15 px-4 py-2">
            أصناف متاحة: {products.length}
          </span>
          <span className="rounded-2xl bg-white/15 px-4 py-2">في السلة: {count}</span>
          <span className="rounded-2xl bg-white/15 px-4 py-2">
            إجمالي الطلب: {formatMoney(totalCost, currency)}
          </span>
          <span className="rounded-2xl bg-amber-300 px-4 py-2 text-amber-950">
            ربحك المتوقع: {formatMoney(totalProfit, currency)}
          </span>
        </div>
      </section>

      <div className="sticky top-[68px] z-30 -mx-1 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 backdrop-blur sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث باسم المادة أو الصنف أو الكود…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white sm:max-w-xs"
        />
        <div className="flex flex-1 flex-wrap gap-1.5">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-xl px-3 py-1.5 text-[13px] font-bold transition ${
                category === item
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <Link
          href="/cart"
          className="rounded-xl bg-amber-400 px-4 py-2.5 text-center text-[13px] font-black text-amber-950 shadow transition hover:bg-amber-300"
        >
          إرسال الفاتورة واتساب
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-bold text-slate-700">لا توجد أصناف مطابقة</p>
          <p className="mt-1 text-sm text-slate-500">
            جرّب كلمة بحث أخرى، أو تأكد أن الإدارة كتبت كمية أكبر من صفر لهذا الصنف.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
