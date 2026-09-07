import { db } from "@/db";

import {
  drivers,
  orders,
  restaurants,
} from "@/db/schema";

import { eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth";

import {
  DeliveryDriver,
  DriverAssignmentService,
} from "@/core/domain";

export const dynamic =
  "force-dynamic";

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

  const rows =
    await db
      .select({
        order: orders,
        restaurant:
          restaurants,
      })
      .from(orders)
      .leftJoin(
        restaurants,
        eq(
          orders.restaurantId,
          restaurants.id,
        ),
      );

  const meDriver =
    new DeliveryDriver(
      me.id,
      user.name,
      {
        lat: me.lat,
        lng: me.lng,
      },
      me.isOnline,
      me.rating,
      me.deliveriesCount,
    );

  const readyUnassigned =
    me.isOnline
      ? rows.filter(
          (item) =>
            item.order
              .status ===
              "ready" &&
            item.order
              .driverId ===
              null,
        )
      : [];

  const available =
    readyUnassigned
      .map((item) => {
        const pickup = {
          lat:
            item
              .restaurant
              ?.lat ??
            24.7136,

          lng:
            item
              .restaurant
              ?.lng ??
            46.6753,
        };

        const priority =
          meDriver.priorityScore(
            pickup,
          );

        const distToPickup =
          Math.round(
            meDriver.distanceTo(
              pickup,
            ) * 100,
          ) / 100;

        return {
          ...item.order,

          items:
            JSON.parse(
              item.order
                .items,
            ),

          restaurantName:
            item.restaurant
              ?.name ??
            null,

          restaurantLat:
            item.restaurant
              ?.lat ??
            null,

          restaurantLng:
            item.restaurant
              ?.lng ??
            null,

          distToPickup,
          priority,
        };
      })
      .sort(
        (a, b) =>
          a.priority -
          b.priority,
      );

  const mine =
    rows
      .filter(
        (item) =>
          item.order
            .driverId ===
            me.id &&
          [
            "assigned",
            "delivering",
          ].includes(
            item.order
              .status,
          ),
      )
      .map((item) => ({
        ...item.order,

        items:
          JSON.parse(
            item.order.items,
          ),

        restaurantName:
          item.restaurant
            ?.name ??
          null,

        restaurantLat:
          item.restaurant
            ?.lat ??
          null,

        restaurantLng:
          item.restaurant
            ?.lng ??
          null,
      }));

  return Response.json({
    available,
    mine,
    driver: me,
  });
}

export async function POST() {
  const allDrivers =
    await db
      .select()
      .from(drivers);

  const objects =
    allDrivers.map(
      (driver) =>
        new DeliveryDriver(
          driver.id,

          `driver#${driver.id}`,

          {
            lat:
              driver.lat,
            lng:
              driver.lng,
          },

          driver.isOnline,
          driver.rating,
          driver.deliveriesCount,
        ),
    );

  const ranked =
    DriverAssignmentService.rankDrivers(
      objects,

      {
        lat: 24.7136,
        lng: 46.6753,
      },
    );

  return Response.json({
    ranked:
      ranked.map(
        (driver) =>
          driver.id,
      ),
  });
}