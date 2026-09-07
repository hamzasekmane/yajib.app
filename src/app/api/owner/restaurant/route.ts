import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.id))
    .limit(1);
  return Response.json({ restaurant: rows[0] ?? null });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const rows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.id))
    .limit(1);
  const r = rows[0];
  if (!r) return Response.json({ error: "لا يوجد مطعم" }, { status: 404 });

  const [updated] = await db
    .update(restaurants)
    .set({
      name: body.name ?? r.name,
      description: body.description ?? r.description,
      cuisine: body.cuisine ?? r.cuisine,
      isOpen: typeof body.isOpen === "boolean" ? body.isOpen : r.isOpen,
    })
    .where(eq(restaurants.id, r.id))
    .returning();
  return Response.json({ restaurant: updated });
}
