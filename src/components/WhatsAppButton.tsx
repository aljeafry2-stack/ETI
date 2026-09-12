"use client";

import { useState } from "react";
import { whatsappLink } from "@/lib/pricing-client";

export function WhatsAppButton({
  number,
  text,
  label = "إرسال الفاتورة عبر واتساب",
}: {
  number: string;
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const open = () => {
    const url = whatsappLink(number, text);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) window.location.href = url;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={open}
        className="flex-1 rounded-2xl bg-[#25D366] px-5 py-3.5 text-[15px] font-black text-white shadow-lg shadow-emerald-600/20 transition hover:brightness-95"
      >
        {label}
      </button>
      <button
        type="button"
        onClick={copy}
        className="rounded-2xl border border-slate-200 px-5 py-3.5 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50"
      >
        {copied ? "تم النسخ ✓" : "نسخ نص الفاتورة"}
      </button>
    </div>
  );
}
