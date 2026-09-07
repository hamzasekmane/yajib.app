"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import {
  FaCartShopping,
  FaCircleCheck,
  FaLocationCrosshairs,
  FaLocationDot,
  FaMinus,
  FaPlus,
  FaSpinner,
  FaTriangleExclamation,
  FaUser,
} from "react-icons/fa6";

import type { MenuItem } from "@/db/schema";
import { money } from "@/lib/status";

const DriverMap = dynamic(() => import("@/components/DriverMap"), {
  ssr: false,
});

type CustomerLocation = {
  lat: number;
  lng: number;
  accuracy: number;
};

export default function RestaurantMenu({
  restaurantId,
  restaurantLat,
  restaurantLng,
  isOpen,
  menu,
  canOrder,
  isLoggedIn,
}: {
  restaurantId: number;
  restaurantLat: number;
  restaurantLng: number;
  isOpen: boolean;
  menu: MenuItem[];
  canOrder: boolean;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("rpage");
  const router = useRouter();

  const [cart, setCart] = useState<Record<number, number>>({});
  const [address, setAddress] = useState("");

  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  /*
   * GPS الزبون
   */
  const [customerLocation, setCustomerLocation] =
    useState<CustomerLocation | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  /*
   * إظهار/إخفاء معاينة الخريطة
   */
  const [showMap, setShowMap] = useState(false);

  const categories = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};

    for (const item of menu) {
      const category = item.category ?? "أخرى";

      if (!map[category]) {
        map[category] = [];
      }

      map[category].push(item);
    }

    return map;
  }, [menu]);

  const categoryNames = Object.keys(categories);

  const subtotal = useMemo(() => {
    return menu.reduce((sum, item) => {
      const qty = cart[item.id] ?? 0;

      return sum + item.price * qty;
    }, 0);
  }, [cart, menu]);

  const itemCount = Object.values(cart).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  function change(id: number, delta: number) {
    setCart((current) => {
      const next = {
        ...current,
      };

      const quantity = (next[id] ?? 0) + delta;

      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }

      return next;
    });
  }

  /*
   * الحصول على GPS الزبون.
   */
  function getCustomerLocation() {
    if (!navigator.geolocation) {
      setLocationError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }

    setLocationError("");
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setLocationLoading(false);
        setShowMap(true);
      },

      (geoError) => {
        setLocationLoading(false);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError(
            "تم رفض إذن الموقع. فعّل GPS من إعدادات المتصفح ثم حاول مرة أخرى.",
          );
          return;
        }

        if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setLocationError("تعذر تحديد موقع الهاتف.");
          return;
        }

        if (geoError.code === geoError.TIMEOUT) {
          setLocationError("استغرق تحديد الموقع وقتًا طويلًا. حاول مرة أخرى.");
          return;
        }

        setLocationError("تعذر تحديد موقعك.");
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  }

  /*
   * إنشاء الطلب.
   */
  async function placeOrder() {
    if (placing || done) {
      return;
    }

    setError("");

    if (itemCount === 0) {
      setError("السلة فارغة.");
      return;
    }

    /*
     * نجعل GPS مطلوبًا حتى لا تُحفظ إحداثيات الرياض
     * الافتراضية بدل الموقع الحقيقي للزبون.
     */
    if (!customerLocation) {
      setError("يرجى تحديد موقع التوصيل أولاً.");
      return;
    }

    setPlacing(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          restaurantId,

          address,

          /*
           * هذه أهم إضافة.
           */
          destLat: customerLocation.lat,
          destLng: customerLocation.lng,

          cart: Object.entries(cart).map(([id, qty]) => ({
            id: Number(id),
            qty,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? t("orderFailed"));
        return;
      }

      setDone(true);
      setCart({});

      setTimeout(() => {
        router.push("/orders");
        router.refresh();
      }, 1200);
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 pb-64">
      {/* القائمة فارغة */}
      {categoryNames.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {t("emptyMenu")}
        </div>
      )}

      {/* التصنيفات */}
      {categoryNames.length > 1 && (
        <div className="sticky top-16 z-30 -mx-5 mb-6 flex gap-2 overflow-x-auto bg-slate-50/95 px-5 py-3 backdrop-blur">
          {categoryNames.map((category) => (
            <a
              key={category}
              href={`#cat-${encodeURIComponent(category)}`}
              className="whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:text-emerald-600 hover:ring-emerald-200"
            >
              {category}
            </a>
          ))}
        </div>
      )}

      {/* الأصناف */}
      {categoryNames.map((category) => (
        <section
          key={category}
          id={`cat-${encodeURIComponent(category)}`}
          className="mb-8 scroll-mt-32"
        >
          <h2 className="mb-3 text-lg font-black text-slate-900">
            {category}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories[category].map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-slate-100 transition hover:shadow-sm hover:ring-emerald-100"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  {item.emoji ?? "🍽️"}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-black text-slate-900">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {item.description}
                    </p>
                  )}

                  <p className="mt-1 text-sm font-black text-emerald-600">
                    {money(item.price)}
                  </p>
                </div>

                {canOrder && isOpen && item.available ? (
                  cart[item.id] ? (
                    <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 p-1">
                      <button
                        type="button"
                        onClick={() => change(item.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm transition hover:bg-slate-50"
                        aria-label="إنقاص"
                      >
                        <FaMinus className="text-xs" />
                      </button>

                      <span className="w-5 text-center text-sm font-black">
                        {cart[item.id]}
                      </span>

                      <button
                        type="button"
                        onClick={() => change(item.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
                        aria-label="زيادة"
                      >
                        <FaPlus className="text-xs" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => change(item.id, 1)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
                    >
                      <FaPlus className="text-[10px]" />
                      {t("add")}
                    </button>
                  )
                ) : canOrder && isOpen && !item.available ? (
                  <span className="text-[11px] font-bold text-slate-400">
                    {t("unavailable")}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* غير مسجل */}
      {!isLoggedIn && menu.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 rounded-3xl bg-emerald-50 p-5 text-center text-sm text-emerald-800 ring-1 ring-emerald-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-extrabold text-emerald-700 underline"
          >
            <FaUser className="text-xs" />
            {t("loginLink")}
          </Link>

          <span>{t("loginPrompt")}</span>
        </div>
      )}

      {/* Owner / Driver */}
      {isLoggedIn && !canOrder && menu.length > 0 && (
        <div className="rounded-3xl bg-slate-100 p-4 text-center text-sm text-slate-500">
          {t("onlyCustomers")}
        </div>
      )}

      {/* Cart */}
      {canOrder && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.10)] backdrop-blur">
          <div className="mx-auto max-w-4xl space-y-3 p-4">
            {done ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-4 text-sm font-black text-emerald-700">
                <FaCircleCheck />
                {t("sent")}
              </div>
            ) : (
              <>
                {/* Address */}
                <div className="relative">
                  <FaLocationDot className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("addressPlaceholder")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pe-4 ps-10 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* GPS */}
                <button
                  type="button"
                  onClick={getCustomerLocation}
                  disabled={locationLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition disabled:opacity-60 ${
                    customerLocation
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {locationLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : customerLocation ? (
                    <FaCircleCheck />
                  ) : (
                    <FaLocationCrosshairs />
                  )}

                  {locationLoading
                    ? "جارٍ تحديد الموقع..."
                    : customerLocation
                      ? "تم تحديد موقع التوصيل"
                      : "استخدم موقعي الحالي"}
                </button>

                {customerLocation && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                    <span className="flex items-center gap-1.5 font-bold">
                      <FaLocationDot />
                      موقع GPS جاهز
                    </span>

                    <span dir="ltr">
                      {customerLocation.lat.toFixed(5)},{" "}
                      {customerLocation.lng.toFixed(5)}
                    </span>

                    <span>±{Math.round(customerLocation.accuracy)}m</span>

                    <button
                      type="button"
                      onClick={() => setShowMap((current) => !current)}
                      className="font-bold underline"
                    >
                      {showMap ? "إخفاء الخريطة" : "عرض الخريطة"}
                    </button>
                  </div>
                )}

                {locationError && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700">
                    <FaTriangleExclamation className="mt-0.5 shrink-0" />
                    {locationError}
                  </div>
                )}

                {/* معاينة: المطعم -> الزبون */}
                {showMap && customerLocation && (
                  <div className="max-h-[260px] overflow-hidden rounded-2xl ring-1 ring-slate-200">
                    <DriverMap
                      restaurantLat={restaurantLat}
                      restaurantLng={restaurantLng}
                      destLat={customerLocation.lat}
                      destLng={customerLocation.lng}
                      leg="dropoff"
                      height={250}
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600">
                    {error}
                  </div>
                )}

                {/* Place order */}
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={placing || !customerLocation}
                  className="flex w-full items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    {placing ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCartShopping />
                    )}

                    {placing
                      ? t("sending")
                      : `${t("orderNow")} (${itemCount})`}
                  </span>

                  <span>{money(subtotal)}</span>
                </button>

                {!customerLocation && (
                  <p className="text-center text-[11px] font-medium text-amber-600">
                    يجب تحديد موقع التوصيل قبل إرسال الطلب.
                  </p>
                )}

                <p className="text-center text-[11px] text-slate-400">
                  {t("feeNote")}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}