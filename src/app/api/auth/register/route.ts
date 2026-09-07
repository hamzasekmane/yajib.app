import { db } from "@/db";
import { users, drivers, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "restaurant"
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, password, role, restaurantName, cuisine } = body;

    if (!name || !phone || !password || !role) {
      return Response.json({ error: "كل الحقول مطلوبة" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    if (existing.length) {
      return Response.json(
        { error: "رقم الهاتف مسجل مسبقاً" },
        { status: 409 },
      );
    }

    const lat = 24.7136 + (Math.random() - 0.5) * 0.1;
    const lng = 46.6753 + (Math.random() - 0.5) * 0.1;

    const [user] = await db
      .insert(users)
      .values({
        name,
        phone,
        password: hashPassword(password),
        role,
        lat,
        lng,
      })
      .returning();

    if (role === "driver") {
      await db.insert(drivers).values({ userId: user.id, lat, lng });
    }

    if (role === "owner") {
      const base = slugify(restaurantName || name);
      let slug = base;
      let n = 1;
      while (
        (
          await db
            .select()
            .from(restaurants)
            .where(eq(restaurants.slug, slug))
            .limit(1)
        ).length
      ) {
        slug = `${base}-${n++}`;
      }
      const colors = ["#f97316", "#ef4444", "#10b981", "#6366f1", "#ec4899"];
      await db.insert(restaurants).values({
        ownerId: user.id,
        name: restaurantName || `مطعم ${name}`,
        slug,
        cuisine: cuisine || "عام",
        logoColor: colors[Math.floor(Math.random() * colors.length)],
        lat,
        lng,
      });
    }

    await setSession(user.id);
    return Response.json({ ok: true, role: user.role });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "حدث خطأ فى الخادم" }, { status: 500 });
  }
}
