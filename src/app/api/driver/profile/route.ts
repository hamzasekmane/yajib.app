import { db } from "@/db";
import { drivers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "driver"
  ) {
    return Response.json(
      {
        error:
          "غير مصرح",
      },
      {
        status: 401,
      },
    );
  }

  const [driver] =
    await db
      .select()
      .from(drivers)
      .where(
        eq(
          drivers.userId,
          user.id,
        ),
      )
      .limit(1);

  return Response.json({
    driver:
      driver ?? null,
  });
}

export async function PATCH(
  req: Request,
) {
  const user =
    await getCurrentUser();

  if (
    !user ||
    user.role !== "driver"
  ) {
    return Response.json(
      {
        error:
          "غير مصرح",
      },
      {
        status: 401,
      },
    );
  }

  const body =
    await req.json();

  const [driver] =
    await db
      .select()
      .from(drivers)
      .where(
        eq(
          drivers.userId,
          user.id,
        ),
      )
      .limit(1);

  if (!driver) {
    return Response.json(
      {
        error:
          "لا يوجد ملف سائق",
      },
      {
        status: 404,
      },
    );
  }

  const lat =
    typeof body.lat ===
    "number"
      ? body.lat
      : driver.lat;

  const lng =
    typeof body.lng ===
    "number"
      ? body.lng
      : driver.lng;

  if (
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return Response.json(
      {
        error:
          "إحداثيات غير صالحة",
      },
      {
        status: 400,
      },
    );
  }

  const [updated] =
    await db
      .update(drivers)
      .set({
        isOnline:
          typeof body.isOnline ===
          "boolean"
            ? body.isOnline
            : driver.isOnline,

        lat,
        lng,
      })
      .where(
        eq(
          drivers.id,
          driver.id,
        ),
      )
      .returning();

  return Response.json({
    driver: updated,
  });
}