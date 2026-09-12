"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";

export function Header({ companyName }: { companyName: string }) {
  const { count } = useCart();
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const links = [
    { href: "/", label: "الأصناف" },
    { href: "/cart", label: "السلة والفاتورة" },
    { href: "/orders", label: "طلباتي" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-lg font-black text-white shadow-lg shadow-emerald-600/25">
            ETI
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-slate-900">{companyName}</span>
            <span className="block text-xs text-slate-500">طلب الأصناف وإرسال الفاتورة واتساب</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full flex-wrap items-center gap-1.5 sm:order-2 sm:w-auto sm:flex-1 sm:justify-end">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-emerald-600 text-white shadow shadow-emerald-600/25"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {link.label}
                {link.href === "/cart" && count > 0 ? (
                  <span className="ms-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-amber-950">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
