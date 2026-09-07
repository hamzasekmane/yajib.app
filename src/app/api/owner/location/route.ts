import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "owner") {
    return Response.json(
      { error: "غير مصرح" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "بيانات غير صالحة" },
      { status: 400 },
    );
  }

  const { lat, lng } = body as {
    lat?: unknown;
    lng?: unknown;
  };

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return Response.json(
      { error: "إحداثيات غير صالحة" },
      { status: 400 },
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json(
      { error: "الإحداثيات خارج النطاق الصحيح" },
      { status: 400 },
    );
  }

  const [restaurant] = await db
    .update(restaurants)
    .set({
      lat,
      lng,
    })
    .where(eq(restaurants.ownerId, user.id))
    .returning({
      id: restaurants.id,
      lat: restaurants.lat,
      lng: restaurants.lng,
    });

  if (!restaurant) {
    return Response.json(
      { error: "لا يوجد مطعم مرتبط بهذا الحساب" },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    restaurant,
  });
}