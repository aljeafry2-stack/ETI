import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "ETI — طلب الأصناف وإرسال الفاتورة عبر واتساب",
  description:
    "منصة شركة ETI لعرض الأصناف بالكرتون والباكيت والحبة مع حساب ربح العميل وإرسال الفاتورة عبر واتساب.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <CartProvider>
          <Header companyName={settings.companyName} />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
          <SiteFooter companyName={settings.companyName} />
        </CartProvider>
      </body>
    </html>
  );
}
