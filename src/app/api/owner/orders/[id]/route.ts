import { db } from "@/db";
import { restaurants, orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED = ["accepted", "preparing", "ready", "cancelled"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner")
    return Response.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  if (!ALLOWED.includes(status))
    return Response.json({ error: "حالة غير مسموحة" }, { status: 400 });

  const [r] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.id))
    .limit(1);
  if (!r) return Response.json({ error: "لا يوجد مطعم" }, { status: 404 });

  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, Number(id)), eq(orders.restaurantId, r.id)))
    .returning();

  if (!updated) return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
  return Response.json({ order: updated });
}
