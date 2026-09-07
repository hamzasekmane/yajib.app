import { db } from "@/db";

import {
  drivers,
  orders,
} from "@/db/schema";

import {
  and,
  eq,
  isNull,
  sql,
} from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth";

export const dynamic =
  "force-dynamic";

export async function PATCH(
  req: Request,

  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
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

  const { id } =
    await params;

  const orderId =
    Number(id);

  if (
    !Number.isFinite(
      orderId,
    )
  ) {
    return Response.json(
      {
        error:
          "رقم الطلب غير صالح",
      },
      {
        status: 400,
      },
    );
  }

  const body =
    await req.json();

  const action =
    body.action;

  const [me] =
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

  if (!me) {
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

  if (
    action === "accept"
  ) {
    if (!me.isOnline) {
      return Response.json(
        {
          error:
            "يجب أن تكون متصلاً لقبول الطلب",
        },
        {
          status: 409,
        },
      );
    }

    const [claimed] =
      await db
        .update(orders)
        .set({
          status:
            "assigned",

          driverId:
            me.id,

          updatedAt:
            new Date(),
        })
        .where(
          and(
            eq(
              orders.id,
              orderId,
            ),

            eq(
              orders.status,
              "ready",
            ),

            isNull(
              orders.driverId,
            ),
          ),
        )
        .returning();

    if (!claimed) {
      return Response.json(
        {
          error:
            "الطلب لم يعد متاحاً",
        },
        {
          status: 409,
        },
      );
    }

    return Response.json({
      order: claimed,
    });
  }

  const [order] =
    await db
      .select()
      .from(orders)
      .where(
        eq(
          orders.id,
          orderId,
        ),
      )
      .limit(1);

  if (!order) {
    return Response.json(
      {
        error:
          "الطلب غير موجود",
      },
      {
        status: 404,
      },
    );
  }

  if (
    order.driverId !==
    me.id
  ) {
    return Response.json(
      {
        error:
          "هذا الطلب ليس لك",
      },
      {
        status: 403,
      },
    );
  }

  if (
    action ===
      "pickup" &&
    order.status ===
      "assigned"
  ) {
    const [updated] =
      await db
        .update(orders)
        .set({
          status:
            "delivering",

          updatedAt:
            new Date(),
        })
        .where(
          and(
            eq(
              orders.id,
              orderId,
            ),
            eq(
              orders.driverId,
              me.id,
            ),
            eq(
              orders.status,
              "assigned",
            ),
          ),
        )
        .returning();

    return Response.json({
      order: updated,
    });
  }

  if (
    action ===
      "deliver" &&
    order.status ===
      "delivering"
  ) {
    const [updated] =
      await db
        .update(orders)
        .set({
          status:
            "delivered",

          updatedAt:
            new Date(),
        })
        .where(
          and(
            eq(
              orders.id,
              orderId,
            ),
            eq(
              orders.driverId,
              me.id,
            ),
            eq(
              orders.status,
              "delivering",
            ),
          ),
        )
        .returning();

    if (!updated) {
      return Response.json(
        {
          error:
            "تعذر تحديث الطلب",
        },
        {
          status: 409,
        },
      );
    }

    await db
      .update(drivers)
      .set({
        deliveriesCount:
          sql`${drivers.deliveriesCount} + 1`,
      })
      .where(
        eq(
          drivers.id,
          me.id,
        ),
      );

    return Response.json({
      order: updated,
    });
  }

  return Response.json(
    {
      error:
        "إجراء غير صالح",
    },
    {
      status: 400,
    },
  );
}