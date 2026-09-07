"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  FaBagShopping,
  FaCircleCheck,
  FaClock,
  FaLocationDot,
  FaMotorcycle,
  FaReceipt,
  FaSpinner,
  FaStar,
  FaStore,
  FaTruckFast,
  FaUtensils,
} from "react-icons/fa6";

import {
  money,
} from "@/lib/status";

import {
  StatusPill,
} from "@/components/dashboard/ui";

const DriverMap = dynamic(
  () =>
    import(
      "@/components/DriverMap"
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[300px] items-center justify-center bg-slate-100">
        <FaSpinner className="animate-spin text-2xl text-emerald-600" />
      </div>
    ),
  },
);

type Line = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

interface CustomerOrder {
  id: number;

  customerId: number;

  restaurantId: number;

  driverId:
    | number
    | null;

  status: string;

  items: string;

  subtotal: number;

  deliveryFee: number;

  total: number;

  distanceKm: number;

  address: string;

  destLat:
    | number
    | null;

  destLng:
    | number
    | null;

  restaurantName:
    | string
    | null;

  restaurantLat:
    | number
    | null;

  restaurantLng:
    | number
    | null;

  driverLat:
    | number
    | null;

  driverLng:
    | number
    | null;

  driverRating:
    | number
    | null;

  driverVehicle:
    | string
    | null;
}

const STATUS_KEYS = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "assigned",
  "delivering",
  "delivered",
  "cancelled",
] as const;

type StatusKey =
  (typeof STATUS_KEYS)[number];

/*
 * هنا وضعنا assigned
 * بين ready و delivering.
 */
const STEPS = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "assigned",
  "delivering",
  "delivered",
] as const;

export default function OrdersList() {
  const statusT =
    useTranslations(
      "status",
    );

  const pageT =
    useTranslations(
      "ordersPage",
    );

  const [
    orders,
    setOrders,
  ] =
    useState<
      CustomerOrder[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const load =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/orders",
            {
              cache:
                "no-store",
            },
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setOrders(
          data.orders ??
            [],
        );
      } catch (
        error
      ) {
        console.error(
          "Orders load error:",
          error,
        );
      } finally {
        setLoading(
          false,
        );
      }
    }, []);

  /*
   * polling:
   *
   * موقع السائق يأتي من DB.
   * DriverDashboard يحدث DB.
   * الزبون يجلبه كل 4 ثوان.
   */
  useEffect(() => {
    load();

    const timer =
      setInterval(
        load,
        4000,
      );

    return () =>
      clearInterval(timer);
  }, [load]);

  function statusLabel(
    status: string,
  ) {
    if (
      (
        STATUS_KEYS as readonly string[]
      ).includes(status)
    ) {
      return statusT(
        status as StatusKey,
      );
    }

    return status;
  }

  if (loading) {
    return (
      <div className="mt-6 space-y-4">
        {[1, 2].map(
          (item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-3xl bg-white ring-1 ring-slate-100"
            />
          ),
        )}
      </div>
    );
  }

  if (
    orders.length ===
    0
  ) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
          <FaReceipt />
        </div>

        <h2 className="mt-4 font-black text-slate-900">
          {pageT(
            "empty",
          )}
        </h2>

        <Link
          href="/#restaurants"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <FaUtensils />

          {pageT(
            "browse",
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {orders.map(
        (order) => {
          let lines: Line[] =
            [];

          try {
            lines =
              JSON.parse(
                order.items,
              );
          } catch {
            lines = [];
          }

          const stepIndex =
            STEPS.indexOf(
              order.status as
                | (typeof STEPS)[number],
            );

          const tracking =
            order.status ===
              "assigned" ||
            order.status ===
              "delivering";

          const hasDriverLocation =
            order.driverLat !=
              null &&
            order.driverLng !=
              null;

          const hasDestination =
            order.destLat !=
              null &&
            order.destLng !=
              null;

          return (
            <article
              key={
                order.id
              }
              className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"
            >
              {/*
               * Header
               */}
              <div className="p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <FaReceipt />
                    </span>

                    <div>
                      <h2 className="font-black text-slate-900">
                        طلب #
                        {
                          order.id
                        }
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {lines.reduce(
                          (
                            sum,
                            line,
                          ) =>
                            sum +
                            line.qty,
                          0,
                        )}{" "}
                        أصناف
                      </p>
                    </div>
                  </div>

                  <StatusPill
                    status={
                      order.status
                    }
                    label={statusLabel(
                      order.status,
                    )}
                  />
                </div>

                {/*
                 * Restaurant
                 */}
                {order.restaurantName && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <FaStore />
                    </span>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400">
                        المطعم
                      </p>

                      <p className="text-sm font-black text-slate-800">
                        {
                          order.restaurantName
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/*
                 * Status progress
                 */}
                {order.status !==
                  "cancelled" &&
                  stepIndex >=
                    0 && (
                    <div className="mt-6">
                      <div className="relative flex items-center">
                        {STEPS.map(
                          (
                            step,
                            index,
                          ) => (
                            <div
                              key={
                                step
                              }
                              className="flex flex-1 items-center last:flex-none"
                            >
                              <div
                                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[9px] transition ${
                                  index <=
                                  stepIndex
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-slate-200 bg-white text-slate-300"
                                }`}
                              >
                                {index <
                                stepIndex ? (
                                  <FaCircleCheck />
                                ) : (
                                  index +
                                  1
                                )}
                              </div>

                              {index <
                                STEPS.length -
                                  1 && (
                                <div
                                  className={`h-1 w-full ${
                                    index <
                                    stepIndex
                                      ? "bg-emerald-500"
                                      : "bg-slate-200"
                                  }`}
                                />
                              )}
                            </div>
                          ),
                        )}
                      </div>

                      <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-400">
                        <span>
                          {statusLabel(
                            "pending",
                          )}
                        </span>

                        <span>
                          {statusLabel(
                            "ready",
                          )}
                        </span>

                        <span>
                          {statusLabel(
                            "delivered",
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                {/*
                 * Driver
                 */}
                {tracking && (
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                        <FaMotorcycle />

                        <span className="live-dot absolute -end-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-lime-400" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-emerald-800">
                          {order.status ===
                          "assigned"
                            ? "السائق متجه إلى المطعم"
                            : "طلبك في الطريق إليك"}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-emerald-700/70">
                          {order.driverVehicle && (
                            <span>
                              {
                                order.driverVehicle
                              }
                            </span>
                          )}

                          {order.driverRating !=
                            null && (
                            <>
                              <span>
                                ·
                              </span>

                              <span className="flex items-center gap-1">
                                <FaStar className="text-amber-400" />

                                {order.driverRating.toFixed(
                                  1,
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {hasDriverLocation && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" />

                          مباشر
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/*
               * Live map
               */}
              {tracking &&
                hasDriverLocation &&
                hasDestination && (
                  <div className="relative border-y border-slate-100">
                    <div className="absolute start-3 top-3 z-[500] flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-slate-700 shadow-md backdrop-blur">
                      <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" />

                      تتبع مباشر
                    </div>

                    <DriverMap
                      driverLat={
                        order.driverLat
                      }
                      driverLng={
                        order.driverLng
                      }
                      restaurantLat={
                        order.restaurantLat
                      }
                      restaurantLng={
                        order.restaurantLng
                      }
                      destLat={
                        order.destLat
                      }
                      destLng={
                        order.destLng
                      }
                      leg={
                        order.status ===
                        "assigned"
                          ? "pickup"
                          : "dropoff"
                      }
                      height={
                        330
                      }
                    />
                  </div>
                )}

              {/*
               * Body
               */}
              <div className="p-5 md:p-6">
                {/*
                 * Items
                 */}
                <div className="space-y-3">
                  {lines.map(
                    (line) => (
                      <div
                        key={
                          line.id
                        }
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xs font-black text-emerald-600">
                            {
                              line.qty
                            }
                            ×
                          </span>

                          <span className="truncate font-bold text-slate-700">
                            {
                              line.name
                            }
                          </span>
                        </div>

                        <span className="shrink-0 font-bold text-slate-500">
                          {money(
                            line.price *
                              line.qty,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                {/*
                 * Destination
                 */}
                {order.address && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                      <FaLocationDot />
                    </span>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400">
                        عنوان التوصيل
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-700">
                        {
                          order.address
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/*
                 * Totals
                 */}
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>
                      {
                        pageT(
                          "distance",
                        )
                      }
                    </span>

                    <span>
                      {
                        order.distanceKm
                      }{" "}
                      كم
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>
                      {pageT(
                        "deliveryFee",
                      )}
                    </span>

                    <span>
                      {money(
                        order.deliveryFee,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-3">
                    <span className="font-black text-slate-900">
                      {pageT(
                        "total",
                      )}
                    </span>

                    <span className="text-lg font-black text-emerald-600">
                      {money(
                        order.total,
                      )}
                    </span>
                  </div>
                </div>

                {/*
                 * Messages
                 */}
                {order.status ===
                  "pending" && (
                  <Message
                    icon={
                      FaClock
                    }
                    color="amber"
                  >
                    طلبك بانتظار
                    موافقة المطعم.
                  </Message>
                )}

                {order.status ===
                  "preparing" && (
                  <Message
                    icon={
                      FaUtensils
                    }
                    color="sky"
                  >
                    المطعم يحضّر
                    طلبك الآن.
                  </Message>
                )}

                {order.status ===
                  "ready" && (
                  <Message
                    icon={
                      FaMotorcycle
                    }
                    color="lime"
                  >
                    الطلب جاهز،
                    نبحث عن أقرب
                    سائق.
                  </Message>
                )}

                {order.status ===
                  "delivered" && (
                  <Message
                    icon={
                      FaCircleCheck
                    }
                    color="emerald"
                  >
                    تم توصيل طلبك
                    بنجاح.
                  </Message>
                )}
              </div>
            </article>
          );
        },
      )}
    </div>
  );
}

function Message({
  icon: Icon,
  color,
  children,
}: {
  icon:
    typeof FaClock;

  color:
    | "amber"
    | "sky"
    | "lime"
    | "emerald";

  children:
    React.ReactNode;
}) {
  const colors = {
    amber:
      "bg-amber-50 text-amber-700",

    sky:
      "bg-sky-50 text-sky-700",

    lime:
      "bg-lime-50 text-lime-700",

    emerald:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${colors[color]}`}
    >
      <Icon className="shrink-0" />

      {children}
    </div>
  );
}