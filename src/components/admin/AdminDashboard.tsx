"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatMoney, unitCost, unitProfit, unitRetail } from "@/lib/pricing";

export type AdminProduct = {
  id: number;
  sku: string | null;
  name: string;
  category: string;
  description: string;
  packetsPerCarton: number;
  piecesPerPacket: number;
  cartonPrice: number;
  packetPrice: number;
  piecePrice: number;
  retailPiecePrice: number;
  stockCartons: number;
  active: boolean;
  image: string | null;
};

export type AdminOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  shopName: string;
  phone: string;
  itemCount: number;
  totalCost: number;
  totalProfit: number;
  createdAt: string;
};

export type AdminSettings = {
  companyName: string;
  companyWhatsapp: string;
  currency: string;
  invoiceNote: string;
};

type ImportResult = {
  created: number;
  updated: number;
  deactivated: number;
  totalRows: number;
  skipped: number;
  detectedColumns: Record<string, string>;
};

const numberFields: { key: keyof AdminProduct; label: string; step?: string }[] = [
  { key: "packetsPerCarton", label: "باكيت/كرتون", step: "1" },
  { key: "piecesPerPacket", label: "حبة/باكيت", step: "1" },
  { key: "cartonPrice", label: "سعر الكرتون" },
  { key: "packetPrice", label: "سعر الباكيت" },
  { key: "piecePrice", label: "سعر الحبة" },
  { key: "retailPiecePrice", label: "بيع المحل/حبة" },
  { key: "stockCartons", label: "الكمية (كرتون)" },
];

export function AdminDashboard({
  products,
  orders,
  settings,
  passwordIsDefault,
}: {
  products: AdminProduct[];
  orders: AdminOrder[];
  settings: AdminSettings;
  passwordIsDefault: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState<AdminProduct[]>(products);
  const [passForm, setPassForm] = useState({ current: "", next: "", confirm: "" });
  const [settingsForm, setSettingsForm] = useState<AdminSettings>(settings);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const notify = (kind: "ok" | "err", text: string) => {
    setMessage({ kind, text });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const filtered = list.filter((product) => {
    if (!query.trim()) return true;
    const needle = query.trim();
    return (
      product.name.includes(needle) ||
      product.category.includes(needle) ||
      (product.sku ?? "").includes(needle)
    );
  });

  const totals = {
    products: list.length,
    active: list.filter((product) => product.active && product.stockCartons > 0).length,
    outOfStock: list.filter((product) => product.stockCartons <= 0).length,
    orders: orders.length,
    ordersValue: orders.reduce((sum, order) => sum + order.totalCost, 0),
    ordersProfit: orders.reduce((sum, order) => sum + order.totalProfit, 0),
  };

  const patchProduct = async (product: AdminProduct, patch: Partial<AdminProduct>) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, ...patch }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "فشل الحفظ");
      setList((current) =>
        current.map((item) => (item.id === product.id ? { ...item, ...patch } : item)),
      );
      notify("ok", `تم حفظ ${product.name}`);
    } catch (error) {
      notify("err", error instanceof Error ? error.message : "خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (product: AdminProduct) => {
    if (!window.confirm(`حذف الصنف «${product.name}» نهائياً؟`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "فشل الحذف");
      setList((current) => current.filter((item) => item.id !== product.id));
      notify("ok", "تم الحذف");
    } catch (error) {
      notify("err", error instanceof Error ? error.message : "خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (product: AdminProduct, file: File) => {
    const body = new FormData();
    body.append("productId", String(product.id));
    body.append("file", file);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products/image", { method: "POST", body });
      const data = (await response.json()) as { ok: boolean; src?: string; error?: string };
      if (!data.ok || !data.src) throw new Error(data.error ?? "فشل رفع الصورة");
      setList((current) =>
        current.map((item) => (item.id === product.id ? { ...item, image: data.src as string } : item)),
      );
      notify("ok", `تم حفظ صورة ${product.name} — تُحفظ مرة واحدة ولا تحتاج رفعها مرة أخرى`);
    } catch (error) {
      notify("err", error instanceof Error ? error.message : "خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const importExcel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!(form.get("file") instanceof File) || (form.get("file") as File).size === 0) {
      notify("err", "اختر ملف Excel أولاً");
      return;
    }
    setBusy(true);
    setImportResult(null);
    try {
      const response = await fetch("/api/admin/import", { method: "POST", body: form });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
      } & ImportResult;
      if (!data.ok) throw new Error(data.error ?? "فشل الاستيراد");
      setImportResult({
        created: data.created,
        updated: data.updated,
        deactivated: data.deactivated,
        totalRows: data.totalRows,
        skipped: data.skipped,
        detectedColumns: data.detectedColumns,
      });
      notify("ok", "تم تحديث الأصناف من ملف Excel");
      router.refresh();
      const refreshed = await fetch("/api/admin/products", { cache: "no-store" });
      const payload = (await refreshed.json()) as { products?: AdminProduct[] };
      if (payload.products) setList(payload.products);
    } catch (error) {
      notify("err", error instanceof Error ? error.message : "خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "فشل الحفظ");
      notify("ok", "تم حفظ الإعدادات");
      router.refresh();
    } catch (error) {
      notify("err", error instanceof Error ? error.message : "خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (passForm.next !== passForm.confirm) {
      notify("err", "كلمة المرور الجديدة غير مطابقة للتأكيد");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: passForm.current, next: passForm.next }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "تعذّر تغيير كلمة المرور");
      setPassForm({ current: "", next: "", confirm: "" });
      notify("ok", "تم تغيير كلمة المرور — استخدمها في الدخول القادم");
      router.refresh();
    } catch (error) {
      notify("err", error instanceof Error ? error.message : "خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            message.kind === "ok"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "كل الأصناف", value: String(totals.products) },
          { label: "تظهر للعميل", value: String(totals.active) },
          { label: "نفدت", value: String(totals.outOfStock) },
          { label: "عدد الطلبات", value: String(totals.orders) },
          { label: "قيمة الطلبات", value: formatMoney(totals.ordersValue, settings.currency) },
          { label: "أرباح العملاء", value: formatMoney(totals.ordersProfit, settings.currency) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[11px] font-bold text-slate-500">{card.label}</p>
            <p className="mt-1 text-lg font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* رفع ملف Excel */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900">رفع ملف Excel (قائمة الأصناف)</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              الإكسل للأسماء والأسعار والتعبئة فقط. الكمية لا تُقرأ من الملف — عدّلها من خانة
              «الكمية (كرتون)» تحت كل صنف. الصنف الجديد يبقى مخفياً حتى تكتب له كمية أكبر من صفر.
            </p>
          </div>
          <a
            href="/api/admin/template"
            className="rounded-xl border border-emerald-600 px-4 py-2 text-[13px] font-bold text-emerald-700 hover:bg-emerald-50"
          >
            تحميل قالب Excel
          </a>
        </div>

        <form onSubmit={importExcel} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold file:me-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-white"
          />
          <select
            name="piecePriceMeaning"
            defaultValue="retail"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-bold"
          >
            <option value="retail">سعر الحبة = سعر بيع المحل</option>
            <option value="cost">سعر الحبة = سعر الشراء من ETI</option>
          </select>
          <select
            name="mode"
            defaultValue="merge"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-bold"
          >
            <option value="replace">تحديث كامل (نفّر ما ليس بالملف)</option>
            <option value="merge">دمج فقط</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
          >
            رفع وتحديث
          </button>
        </form>

        {importResult ? (
          <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-[13px] text-slate-700">
            <p className="font-black text-slate-900">
              صفوف الملف: {importResult.totalRows} — أصناف جديدة: {importResult.created} — محدّثة:{" "}
              {importResult.updated} — أصناف نُفِّرت: {importResult.deactivated} — صفوف متجاهَلة:{" "}
              {importResult.skipped}
            </p>
            <p className="mt-2 font-bold">الأعمدة التي تم فهمها:</p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {Object.entries(importResult.detectedColumns).map(([field, column]) => (
                <li key={field} className="rounded-lg bg-white px-2 py-1">
                  <span className="font-bold text-emerald-700">{column}</span> ←{" "}
                  <span className="text-slate-500">{field}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* الأصناف */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-slate-900">الأصناف والصور والكميات</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="بحث…"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold"
            />
            <button
              type="button"
              onClick={() => setShowNew((current) => !current)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white"
            >
              {showNew ? "إخفاء" : "+ صنف جديد"}
            </button>
          </div>
        </div>

        {showNew ? (
          <NewProductForm
            onCreate={async (payload) => {
              setBusy(true);
              try {
                const response = await fetch("/api/admin/products", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data = (await response.json()) as {
                  ok: boolean;
                  product?: AdminProduct;
                  error?: string;
                };
                if (!data.ok || !data.product) throw new Error(data.error ?? "فشل الإضافة");
                setList((current) => [data.product as AdminProduct, ...current]);
                notify("ok", "تمت إضافة الصنف");
                setShowNew(false);
              } catch (error) {
                notify("err", error instanceof Error ? error.message : "خطأ غير متوقع");
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}

        <div className="mt-4 grid gap-3">
          {filtered.map((product) => (
            <div key={product.id} className="rounded-2xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl font-black text-emerald-700/40">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
                <input
                  ref={(node) => {
                    fileInputs.current[product.id] = node;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(product, file);
                    event.target.value = "";
                  }}
                />
                <div className="min-w-[180px] flex-1">
                  <input
                    defaultValue={product.name}
                    onBlur={(event) => {
                      if (event.target.value.trim() !== product.name)
                        void patchProduct(product, { name: event.target.value.trim() });
                    }}
                    className="w-full rounded-lg border border-transparent px-1 py-0.5 text-[15px] font-black text-slate-900 hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    defaultValue={product.category}
                    onBlur={(event) => {
                      if (event.target.value.trim() !== product.category)
                        void patchProduct(product, { category: event.target.value.trim() });
                    }}
                    className="w-full rounded-lg border border-transparent px-1 py-0.5 text-[12px] font-bold text-emerald-700 hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    defaultValue={product.description}
                    placeholder="شرح الصنف…"
                    onBlur={(event) => {
                      if (event.target.value !== product.description)
                        void patchProduct(product, { description: event.target.value });
                    }}
                    className="w-full rounded-lg border border-transparent px-1 py-0.5 text-[12px] text-slate-500 hover:border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    كرتون: {formatMoney(unitCost(product, "carton"), settings.currency)} — بيع المحل:{" "}
                    {formatMoney(unitRetail(product, "carton"), settings.currency)} — ربح:{" "}
                    {formatMoney(unitProfit(product, "carton"), settings.currency)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {numberFields.map((field) => (
                    <label key={field.key} className="text-[10px] font-bold text-slate-500">
                      {field.label}
                      <input
                        type="number"
                        step={field.step ?? "0.01"}
                        defaultValue={Number(product[field.key] as number)}
                        onBlur={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isFinite(value) && value !== Number(product[field.key]))
                            void patchProduct(product, { [field.key]: value } as Partial<AdminProduct>);
                        }}
                        className={`mt-0.5 w-24 rounded-lg border px-2 py-1 text-[13px] font-bold text-slate-800 ${
                          field.key === "stockCartons"
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      />
                    </label>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputs.current[product.id]?.click()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    {product.image ? "تغيير الصورة" : "إرفاق صورة"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void patchProduct(product, { active: !product.active })}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-bold ${
                      product.active ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {product.active ? "إيقاف الظهور" : "إظهار للعميل"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeProduct(product)}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-[12px] font-bold text-rose-600"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              لا توجد أصناف — ارفع ملف Excel أو أضف صنفاً يدوياً.
            </p>
          ) : null}
        </div>
      </section>

      {/* الإعدادات */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-900">إعدادات الفاتورة وواتساب</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-[13px] font-bold text-slate-700">
            اسم الشركة
            <input
              value={settingsForm.companyName}
              onChange={(event) =>
                setSettingsForm({ ...settingsForm, companyName: event.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
            />
          </label>
          <label className="text-[13px] font-bold text-slate-700">
            رقم واتساب الشركة (بصيغة دولية بدون +)
            <input
              value={settingsForm.companyWhatsapp}
              onChange={(event) =>
                setSettingsForm({ ...settingsForm, companyWhatsapp: event.target.value })
              }
              placeholder="201000000000"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
            />
          </label>
          <label className="text-[13px] font-bold text-slate-700">
            العملة
            <input
              value={settingsForm.currency}
              onChange={(event) => setSettingsForm({ ...settingsForm, currency: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
            />
          </label>
          <label className="text-[13px] font-bold text-slate-700">
            ملاحظة أسفل الفاتورة
            <input
              value={settingsForm.invoiceNote}
              onChange={(event) =>
                setSettingsForm({ ...settingsForm, invoiceNote: event.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
          >
            حفظ الإعدادات
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-600"
          >
            خروج
          </button>
        </div>
      </section>

      {/* كلمة المرور */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-900">تغيير كلمة مرور لوحة الإدارة</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          كلمة المرور تُحفظ مشفّرة في قاعدة البيانات، ويستخدمها أنت فقط للدخول إلى هذه الصفحة. عملاؤك
          لا يحتاجون أي كلمة مرور — هم يدخلون على رابط الأصناف مباشرة.
        </p>
        {passwordIsDefault ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-bold text-amber-800">
            ⚠️ ما زلت تستخدم كلمة المرور الافتراضية — يُنصح بتغييرها قبل إرسال الرابط للعملاء.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            [
              { key: "current", label: "كلمة المرور الحالية" },
              { key: "next", label: "الجديدة (4 أحرف على الأقل)" },
              { key: "confirm", label: "تأكيد الجديدة" },
            ] as const
          ).map((field) => (
            <label key={field.key} className="text-[13px] font-bold text-slate-700">
              {field.label}
              <input
                type="password"
                value={passForm[field.key]}
                onChange={(event) => setPassForm({ ...passForm, [field.key]: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void changePassword()}
          disabled={busy}
          className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
        >
          حفظ كلمة المرور الجديدة
        </button>
      </section>

      {/* الطلبات */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black text-slate-900">أحدث الطلبات</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا توجد طلبات بعد.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="text-slate-500">
                  <th className="p-2 text-start">رقم الطلب</th>
                  <th className="p-2 text-start">العميل</th>
                  <th className="p-2 text-start">الجوال</th>
                  <th className="p-2 text-start">الأصناف</th>
                  <th className="p-2 text-start">الإجمالي</th>
                  <th className="p-2 text-start">ربح العميل</th>
                  <th className="p-2 text-start">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="p-2 font-bold text-slate-900">
                      <a href={`/order/${order.id}`} className="hover:text-emerald-700">
                        {order.orderNumber}
                      </a>
                    </td>
                    <td className="p-2 text-slate-700">
                      {order.customerName}
                      {order.shopName ? ` — ${order.shopName}` : ""}
                    </td>
                    <td className="p-2 text-slate-700" dir="ltr">
                      {order.phone}
                    </td>
                    <td className="p-2 text-slate-700">{order.itemCount}</td>
                    <td className="p-2 font-bold text-slate-900">
                      {formatMoney(order.totalCost, settings.currency)}
                    </td>
                    <td className="p-2 font-bold text-emerald-600">
                      {formatMoney(order.totalProfit, settings.currency)}
                    </td>
                    <td className="p-2 text-slate-500">
                      {new Date(order.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function NewProductForm({ onCreate }: { onCreate: (payload: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    packetsPerCarton: "",
    piecesPerPacket: "",
    cartonPrice: "",
    packetPrice: "",
    piecePrice: "",
    retailPiecePrice: "",
    stockCartons: "",
  });

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "name", label: "اسم المادة" },
    { key: "category", label: "الصنف" },
    { key: "packetsPerCarton", label: "باكيت بالكرتون" },
    { key: "piecesPerPacket", label: "حبة بالباكيت" },
    { key: "cartonPrice", label: "سعر الكرتون" },
    { key: "packetPrice", label: "سعر الباكيت" },
    { key: "piecePrice", label: "سعر الحبة" },
    { key: "retailPiecePrice", label: "بيع المحل للحبة" },
    { key: "stockCartons", label: "الكمية (كرتون)" },
  ];

  return (
    <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
      {fields.map((field) => (
        <label key={field.key} className="text-[12px] font-bold text-slate-600">
          {field.label}
          <input
            value={form[field.key]}
            onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold"
          />
        </label>
      ))}
      <label className="text-[12px] font-bold text-slate-600 sm:col-span-3">
        الشرح
        <input
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold"
        />
      </label>
      <button
        type="button"
        onClick={() =>
          void onCreate({
            ...form,
            packetsPerCarton: Number(form.packetsPerCarton) || 0,
            piecesPerPacket: Number(form.piecesPerPacket) || 0,
            cartonPrice: Number(form.cartonPrice) || 0,
            packetPrice: Number(form.packetPrice) || 0,
            piecePrice: Number(form.piecePrice) || 0,
            retailPiecePrice: Number(form.retailPiecePrice) || 0,
            stockCartons: Number(form.stockCartons) || 0,
          })
        }
        className="rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white sm:col-span-3"
      >
        إضافة الصنف
      </button>
    </div>
  );
}
