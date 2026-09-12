import { db } from "@/db";
import { settings } from "@/db/schema";
import { inArray } from "drizzle-orm";

export type AppSettings = {
  companyName: string;
  companyWhatsapp: string;
  currency: string;
  invoiceNote: string;
  managerName: string;
};

const DEFAULTS: AppSettings = {
  companyName: "ETI",
  companyWhatsapp: process.env.COMPANY_WHATSAPP ?? "201000000000",
  currency: "ج.م",
  invoiceNote: "شكراً لتعاملكم معنا — التوصيل خلال 48 ساعة.",
  managerName: "إدارة ETI",
};

const KEYS = Object.keys(DEFAULTS) as (keyof AppSettings)[];

export async function getSettings(): Promise<AppSettings> {
  const result: AppSettings = { ...DEFAULTS };
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(inArray(settings.key, KEYS as unknown as string[]));
    for (const row of rows) {
      if ((KEYS as string[]).includes(row.key) && row.value.trim() !== "") {
        result[row.key as keyof AppSettings] = row.value;
      }
    }
  } catch {
    // قاعدة البيانات غير مهيأة بعد — نُعيد القيم الافتراضية
  }
  if (!/^\d{6,}$/.test(result.companyWhatsapp.replace(/\D/g, ""))) {
    result.companyWhatsapp = DEFAULTS.companyWhatsapp;
  }
  return result;
}

export async function saveSettings(patch: Partial<Record<keyof AppSettings, string>>) {
  const entries = Object.entries(patch).filter(([key]) =>
    (KEYS as string[]).includes(key),
  ) as [keyof AppSettings, string][];
  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value: value ?? "", updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: value ?? "", updatedAt: new Date() },
      });
  }
}
