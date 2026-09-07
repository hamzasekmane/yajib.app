import { db } from "@/db";
import { restaurants, orders, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { Queue } from "@/core/structures";

export const dynamic = "force-dynamic";

/** طلبات المطعم — تُعرض عبر طابور FIFO للطلبات المعلّقة */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner")
    return Response.json({ error: "غير مصرح" }, { status: 401 });

  const [r] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.id))
    .limit(1);
  if (!r) return Response.json({ error: "لا يوجد مطعم" }, { status: 404 });

  const rows = await db
    .select({
      order: orders,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(orders)
    .leftJoin(users, eq(orders.customerId, users.id))
    .where(eq(orders.restaurantId, r.id));

  // بناء طابور FIFO للطلبات المعلّقة حسب وقت الوصول (هيكل بيانات)
  const queue = new Queue<number>();
  rows
    .filter((x) => x.order.status === "pending")
    .sort((a, b) => a.order.id - b.order.id)
    .forEach((x) => queue.enqueue(x.order.id));

  const enriched = rows
    .map((x) => ({
      ...x.order,
      items: JSON.parse(x.order.items),
      customerName: x.customerName,
      customerPhone: x.customerPhone,
    }))
    .sort((a, b) => b.id - a.id);

  return Response.json({
    orders: enriched,
    pendingQueue: queue.toArray(),
    pendingCount: queue.size,
  });
}
