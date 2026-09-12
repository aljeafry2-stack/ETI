"use client";

import { usePathname } from "next/navigation";

export function SiteFooter({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400 sm:px-6">
      {companyName} — اختر الأصناف وأرسل الطلب عبر واتساب
    </footer>
  );
}
