import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!(await verifyPassword(body.password ?? ""))) {
      return Response.json({ ok: false, error: "كلمة المرور غير صحيحة" }, { status: 401 });
    }
    const store = await cookies();
    store.set(ADMIN_COOKIE, await adminToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "تعذّر تسجيل الدخول" }, { status: 400 });
  }
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
