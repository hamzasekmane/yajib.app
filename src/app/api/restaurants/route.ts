import { db } from "@/db";
import { restaurants } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(restaurants);
  return Response.json({ restaurants: rows });
}
