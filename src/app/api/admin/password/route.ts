import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, requireAdmin, setAdminPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as { current?: string; next?: string };
    const next = (body.next ?? "").trim();

    if (!(await verifyPassword(body.current ?? ""))) {
      return Response.json({ ok: false, error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }
    if (next.length < 4) {
      return Response.json(
        { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 4 أحرف أو أرقام على الأقل" },
        { status: 400 },
      );
    }
    await setAdminPassword(next);

    // تحديث الجلسة حتى لا تُطرد بعد التغيير
    const store = await cookies();
    store.set(ADMIN_COOKIE, await adminToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "تعذّر تغيير كلمة المرور" },
      { status: 400 },
    );
  }
}
