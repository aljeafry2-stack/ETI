"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "تعذّر تسجيل الدخول");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-black text-slate-900">دخول الإدارة</h1>
      <p className="mt-1 text-sm text-slate-500">
        هذه الصفحة لك وحدك: رفع الإكسل، الصور، الكميات، والطلبات. لا ترسل هذا الرابط للعميل —
        العميل يدخل على رابط المتجر فقط ولا يرى خيار الإدارة.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-3">
        <label className="text-[13px] font-bold text-slate-700">
          كلمة المرور
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white"
            placeholder="••••••••"
            autoFocus
          />
        </label>
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-bold text-rose-700">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "جارٍ التحقق…" : "دخول"}
        </button>
        <p className="text-center text-[11px] text-slate-400">
          كلمة المرور الافتراضية: <span className="font-bold">eti2026</span> (يمكن تغييرها من متغير
          البيئة ADMIN_PASSWORD)
        </p>
      </form>
    </div>
  );
}
