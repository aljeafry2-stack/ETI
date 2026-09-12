"use client";

import type { ReactNode } from "react";

export function AdminChrome({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-emerald-300">خاص بك فقط — لا يُرسل للعميل</p>
          <p className="text-base font-black">لوحة إدارة ETI</p>
        </div>
        <p className="text-[12px] text-slate-300">احفظ رابط هذه الصفحة في مفضلتك</p>
      </div>
      {children}
    </div>
  );
}
