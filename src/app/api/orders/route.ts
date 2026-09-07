import { db } from "@/db";

import {
  drivers,
  menuItems,
  orders,
  restaurants,
} from "@/db/schema";

import {
  and,
  desc,
  eq,
  inArray,
} from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* =========================================================
   حساب المسافة بين نقطتين
   ========================================================= */

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadius = 6371;

  const toRadians = (value: number) =>
    (value * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    )
  );
}

/* =========================================================
   GET
   طلبات الزبون + المطعم + السائق + GPS
   ========================================================= */

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      {
        error: "غير مصرح",
      },
      {
        status: 401,
      },
    );
  }

  if (user.role !== "customer") {
    return Response.json(
      {
        error: "هذه الصفحة للزبائن فقط",
      },
      {
        status: 403,
      },
    );
  }

  /*
   * orders
   *    ↓
   * restaurants
   *    ↓
   * drivers
   *
   * بهذه الطريقة الزبون سيحصل على:
   *
   * restaurantLat
   * restaurantLng
   *
   * driverLat
   * driverLng
   *
   * destLat / destLng موجودتان أصلًا في order.
   */
  const rows = await db
    .select({
      order: orders,

      restaurantName: restaurants.name,
      restaurantLat: restaurants.lat,
      restaurantLng: restaurants.lng,

      driverLat: drivers.lat,
      driverLng: drivers.lng,
      driverRating: drivers.rating,
      driverVehicle: drivers.vehicle,
    })
    .from(orders)

    .leftJoin(
      restaurants,
      eq(
        orders.restaurantId,
        restaurants.id,
      ),
    )

    .leftJoin(
      drivers,
      eq(
        orders.driverId,
        drivers.id,
      ),
    )

    .where(
      eq(
        orders.customerId,
        user.id,
      ),
    )

    .orderBy(
      desc(
        orders.createdAt,
      ),
    );

  const result = rows.map((row) => ({
    /*
     * يحتوي:
     *
     * id
     * status
     * items
     * destLat
     * destLng
     * ...
     */
    ...row.order,

    restaurantName:
      row.restaurantName ?? null,

    restaurantLat:
      row.restaurantLat ?? null,

    restaurantLng:
      row.restaurantLng ?? null,

    /*
     * إذا لم يتم تعيين سائق بعد،
     * leftJoin سيعطي null.
     */
    driverLat:
      row.driverLat ?? null,

    driverLng:
      row.driverLng ?? null,

    driverRating:
      row.driverRating ?? null,

    driverVehicle:
      row.driverVehicle ?? null,
  }));

  return Response.json({
    orders: result,
  });
}

/* =========================================================
   POST
   إنشاء طلب جديد
   ========================================================= */

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      {
        error: "يجب تسجيل الدخول",
      },
      {
        status: 401,
      },
    );
  }

  if (user.role !== "customer") {
    return Response.json(
      {
        error: "فقط حسابات الزبائن يمكنها الطلب",
      },
      {
        status: 403,
      },
    );
  }

  let body: {
    restaurantId?: unknown;
    address?: unknown;

    /*
     * GPS الزبون.
     */
    destLat?: unknown;
    destLng?: unknown;

    cart?: {
      id: number;
      qty: number;
    }[];
  };

  try {
    body = await req.json();
  } catch {
    return Response.json(
      {
        error: "بيانات الطلب غير صالحة",
      },
      {
        status: 400,
      },
    );
  }

  /* =========================================================
     Restaurant ID
     ========================================================= */

  const restaurantId = Number(
    body.restaurantId,
  );

  if (
    !Number.isInteger(restaurantId) ||
    restaurantId <= 0
  ) {
    return Response.json(
      {
        error: "المطعم غير صالح",
      },
      {
        status: 400,
      },
    );
  }

  /* =========================================================
     Cart validation
     ========================================================= */

  if (
    !Array.isArray(body.cart) ||
    body.cart.length === 0
  ) {
    return Response.json(
      {
        error: "السلة فارغة",
      },
      {
        status: 400,
      },
    );
  }

  /* =========================================================
     Customer GPS
     ========================================================= */

  /*
   * لا نستخدم default هنا.
   *
   * العميل يجب أن يرسل موقعه الحقيقي.
   */
  if (
    typeof body.destLat !== "number" ||
    typeof body.destLng !== "number" ||
    !Number.isFinite(body.destLat) ||
    !Number.isFinite(body.destLng)
  ) {
    return Response.json(
      {
        error:
          "يرجى تحديد موقع التوصيل أولاً من GPS",
      },
      {
        status: 400,
      },
    );
  }

  const destLat = body.destLat;
  const destLng = body.destLng;

  /*
   * Lat:
   * -90 -> 90
   *
   * Lng:
   * -180 -> 180
   */
  if (
    destLat < -90 ||
    destLat > 90 ||
    destLng < -180 ||
    destLng > 180
  ) {
    return Response.json(
      {
        error: "موقع التوصيل غير صالح",
      },
      {
        status: 400,
      },
    );
  }

  /* =========================================================
     Restaurant
     ========================================================= */

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(
      eq(
        restaurants.id,
        restaurantId,
      ),
    )
    .limit(1);

  if (!restaurant) {
    return Response.json(
      {
        error: "المطعم غير موجود",
      },
      {
        status: 404,
      },
    );
  }

  if (!restaurant.isOpen) {
    return Response.json(
      {
        error: "المطعم مغلق حالياً",
      },
      {
        status: 409,
      },
    );
  }

  /*
   * إذا حولت lat/lng في schema إلى nullable
   * فهذا الفحص مهم.
   *
   * إذا ما زالت notNull فلن يسبب أي مشكلة.
   */
  if (
    restaurant.lat == null ||
    restaurant.lng == null
  ) {
    return Response.json(
      {
        error:
          "المطعم لم يحدد موقعه بعد، لا يمكن حساب التوصيل",
      },
      {
        status: 409,
      },
    );
  }

  /* =========================================================
     Clean cart
     ========================================================= */

  const cleanCart = body.cart
    .map((row) => ({
      id: Number(row.id),

      qty: Math.floor(
        Number(row.qty),
      ),
    }))
    .filter(
      (row) =>
        Number.isInteger(row.id) &&
        row.id > 0 &&
        Number.isInteger(row.qty) &&
        row.qty > 0 &&
        row.qty <= 50,
    );

  if (cleanCart.length === 0) {
    return Response.json(
      {
        error: "السلة غير صالحة",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * إزالة IDs المكررة عند Query قاعدة البيانات.
   */
  const uniqueIds = [
    ...new Set(
      cleanCart.map(
        (row) => row.id,
      ),
    ),
  ];

  /* =========================================================
     Menu items
     ========================================================= */

  /*
   * لا نثق بسعر المنتج القادم من Client.
   *
   * السعر الحقيقي دائمًا من DB.
   */
  const databaseItems = await db
    .select()
    .from(menuItems)
    .where(
      and(
        eq(
          menuItems.restaurantId,
          restaurant.id,
        ),

        inArray(
          menuItems.id,
          uniqueIds,
        ),
      ),
    );

  const itemMap = new Map(
    databaseItems.map(
      (item) =>
        [
          item.id,
          item,
        ] as const,
    ),
  );

  const lines: {
    id: number;
    name: string;
    price: number;
    qty: number;
  }[] = [];

  let subtotal = 0;

  /*
   * مهم:
   * لو Client أرسل نفس id مرتين،
   * الأفضل جمع الكمية بدل إنشاء line مكرر.
   */
  const quantityById =
    new Map<number, number>();

  for (const row of cleanCart) {
    quantityById.set(
      row.id,

      (quantityById.get(
        row.id,
      ) ?? 0) + row.qty,
    );
  }

  for (
    const [
      id,
      qty,
    ] of quantityById
  ) {
    /*
     * حد أقصى إجمالي للصنف.
     */
    if (qty > 50) {
      return Response.json(
        {
          error:
            "الكمية المطلوبة كبيرة جداً",
        },
        {
          status: 400,
        },
      );
    }

    const item =
      itemMap.get(id);

    if (!item) {
      return Response.json(
        {
          error:
            "أحد الأصناف غير موجود",
        },
        {
          status: 409,
        },
      );
    }

    if (!item.available) {
      return Response.json(
        {
          error: `${item.name} غير متاح حالياً`,
        },
        {
          status: 409,
        },
      );
    }

    subtotal +=
      item.price * qty;

    lines.push({
      id: item.id,
      name: item.name,
      price: item.price,
      qty,
    });
  }

  /* =========================================================
     Distance
     ========================================================= */

  /*
   * Restaurant GPS
   *
   *          ↓
   *
   * Customer GPS
   */
  const rawDistance =
    haversineKm(
      restaurant.lat,
      restaurant.lng,

      destLat,
      destLng,
    );

  /*
   * حماية إضافية.
   */
  if (
    !Number.isFinite(
      rawDistance,
    )
  ) {
    return Response.json(
      {
        error:
          "تعذر حساب مسافة التوصيل",
      },
      {
        status: 400,
      },
    );
  }

  const distanceKm =
    Math.round(
      rawDistance * 100,
    ) / 100;

  /* =========================================================
     Delivery area
     ========================================================= */

  /*
   * اختياري لكن مهم جدًا.
   *
   * يمنع طلب مثل:
   * الجزائر -> السعودية.
   *
   * عدّل 50 حسب مشروعك.
   */
  const MAX_DELIVERY_KM =
    50;

  if (
    distanceKm >
    MAX_DELIVERY_KM
  ) {
    return Response.json(
      {
        error:
          `عنوان التوصيل خارج نطاق المطعم (${distanceKm} كم)`,
      },
      {
        status: 400,
      },
    );
  }

  /* =========================================================
     Price
     ========================================================= */

  /*
   * مثال:
   *
   * الحد الأدنى 5
   * 2 لكل كيلومتر.
   *
   * يمكنك لاحقًا استبداله بخدمة OOP.
   */
  const deliveryFee =
    Math.round(
      Math.max(
        5,
        distanceKm * 2,
      ) * 100,
    ) / 100;

  subtotal =
    Math.round(
      subtotal * 100,
    ) / 100;

  const total =
    Math.round(
      (
        subtotal +
        deliveryFee
      ) * 100,
    ) / 100;

  /* =========================================================
     Address
     ========================================================= */

  const address =
    typeof body.address ===
    "string"
      ? body.address
          .trim()
          .slice(0, 500)
      : "";

  /* =========================================================
     Insert order
     ========================================================= */

  const [created] = await db
    .insert(orders)
    .values({
      customerId:
        user.id,

      restaurantId:
        restaurant.id,

      /*
       * لا نعيّن Driver الآن.
       *
       * المطعم:
       *
       * pending
       * ↓
       * accepted
       * ↓
       * preparing
       * ↓
       * ready
       *
       * بعدها السائق يقبل.
       */
      status: "pending",

      items:
        JSON.stringify(
          lines,
        ),

      subtotal,

      deliveryFee,

      total,

      distanceKm,

      address,

      /*
       * GPS الزبون الحقيقي.
       */
      destLat,
      destLng,

      updatedAt:
        new Date(),
    })
    .returning();

  /* =========================================================
     Response
     ========================================================= */

  return Response.json(
    {
      ok: true,

      order: created,
    },
    {
      status: 201,
    },
  );
}