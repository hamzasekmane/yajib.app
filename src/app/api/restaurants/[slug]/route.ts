import { db } from "@/db";
import { restaurants, menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const rows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);
  const restaurant = rows[0];
  if (!restaurant) {
    return Response.json({ error: "المطعم غير موجود" }, { status: 404 });
  }
  const menu = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id));
  return Response.json({ restaurant, menu });
}
