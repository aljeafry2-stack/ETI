import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const ADMIN_COOKIE = "eti_admin";
const PASSWORD_KEY = "admin_password_hash";

export function defaultPassword(): string {
  const fromEnv = (process.env.ADMIN_PASSWORD ?? "").trim();
  return fromEnv.length >= 4 ? fromEnv : "eti2026";
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(`eti-admin-v1::${password}`).digest("hex");
}

/** كلمة المرور المحفوظة في قاعدة البيانات، وإن لم تُغيَّر نستخدم الافتراضية من .env */
export async function storedPasswordHash(): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, PASSWORD_KEY))
      .limit(1);
    if (row && row.value.trim() !== "") return row.value.trim();
  } catch {
    // قاعدة البيانات غير مهيأة — نرجع للافتراضي
  }
  return hashPassword(defaultPassword());
}

export async function usingDefaultPassword(): Promise<boolean> {
  return (await storedPasswordHash()) === hashPassword(defaultPassword());
}

export async function verifyPassword(password: string): Promise<boolean> {
  return hashPassword(password.trim()) === (await storedPasswordHash());
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const value = newPassword.trim();
  if (value.length < 4) throw new Error("كلمة المرور يجب أن تكون 4 أحرف على الأقل");
  await db
    .insert(settings)
    .values({ key: PASSWORD_KEY, value: hashPassword(value), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: hashPassword(value), updatedAt: new Date() },
    });
}

/** يتغيّر هذا الرمز عند تغيير كلمة المرور، فتنتهي كل الجلسات القديمة */
export async function adminToken(): Promise<string> {
  return (await storedPasswordHash()).slice(0, 32);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === (await adminToken());
}

export async function requireAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ ok: false, error: "غير مصرح — سجّل الدخول كمسؤول" }, { status: 401 });
}
