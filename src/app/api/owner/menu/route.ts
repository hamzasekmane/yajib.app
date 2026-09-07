import { db } from "@/db";
import { restaurants, menuItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ownerRestaurant(userId: number) {
  const rows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner")
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  const r = await ownerRestaurant(user.id);
  if (!r) return Response.json({ error: "لا يوجد مطعم" }, { status: 404 });

  const body = await req.json();
  if (!body.name || typeof body.price !== "number") {
    return Response.json({ error: "اسم وسعر الصنف مطلوبان" }, { status: 400 });
  }
  const [item] = await db
    .insert(menuItems)
    .values({
      restaurantId: r.id,
      name: body.name,
      description: body.description ?? "",
      price: body.price,
      category: body.category ?? "رئيسى",
      emoji: body.emoji ?? "🍽️",
    })
    .returning();
  return Response.json({ item });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner")
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  const r = await ownerRestaurant(user.id);
  if (!r) return Response.json({ error: "لا يوجد مطعم" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return Response.json({ error: "معرّف غير صالح" }, { status: 400 });

  await db
    .delete(menuItems)
    .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, r.id)));
  return Response.json({ ok: true });
}
