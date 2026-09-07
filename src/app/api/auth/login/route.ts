import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return Response.json({ error: "أدخل الهاتف وكلمة المرور" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    const user = rows[0];
    if (!user || user.password !== hashPassword(password)) {
      return Response.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 },
      );
    }
    await setSession(user.id);
    return Response.json({ ok: true, role: user.role });
  } catch {
    return Response.json({ error: "حدث خطأ فى الخادم" }, { status: 500 });
  }
}
