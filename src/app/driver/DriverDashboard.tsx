"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import dynamic from "next/dynamic";
import type { IconType } from "react-icons";

import {
  FaBagShopping,
  FaCircleCheck,
  FaClock,
  FaHouse,
  FaLocationDot,
  FaMotorcycle,
  FaPowerOff,
  FaRoute,
  FaStar,
  FaStore,
  FaTriangleExclamation,
} from "react-icons/fa6";

import DashboardShell from "@/components/DashboardShell";
import {
  SectionCard,
  StatCard,
  StatusPill,
} from "@/components/dashboard/ui";

import {
  money,
  STATUS_LABELS,
} from "@/lib/status";

import { useGeolocation } from "@/hooks/useGeolocation";

const DriverMap = dynamic(
  () => import("@/components/DriverMap"),
  {
    ssr: false,
  },
);

type Line = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

interface Job {
  id: number;

  status: string;

  items: Line[];

  total: number;

  deliveryFee: number;

  distanceKm: number;

  address: string;

  restaurantName: string | null;

  restaurantLat?: number | null;

  restaurantLng?: number | null;

  destLat?: number | null;

  destLng?: number | null;

  distToPickup?: number;

  priority?: number;
}

interface DriverProfile {
  id: number;

  isOnline: boolean;

  rating: number;

  deliveriesCount: number;

  vehicle: string | null;

  lat: number;

  lng: number;
}

export default function DriverDashboard({
  name,
}: {
  name: string;
}) {
  const [driver, setDriver] =
    useState<DriverProfile | null>(null);

  const [available, setAvailable] =
    useState<Job[]>([]);

  const [mine, setMine] =
    useState<Job[]>([]);

  const {
    coords: gps,
    error: gpsError,
    loading: gpsLoading,
  } = useGeolocation(true);

  const lastSent = useRef(0);

  /*
   * تحميل الملف الشخصي والطلبات.
   */
  const load = useCallback(async () => {
    try {
      const [
        profileResponse,
        jobsResponse,
      ] = await Promise.all([
        fetch("/api/driver/profile", {
          cache: "no-store",
        }),

        fetch("/api/driver/jobs", {
          cache: "no-store",
        }),
      ]);

      if (profileResponse.ok) {
        const data =
          await profileResponse.json();

        setDriver(
          data.driver ?? null,
        );
      }

      if (jobsResponse.ok) {
        const data =
          await jobsResponse.json();

        setAvailable(
          data.available ?? [],
        );

        setMine(
          data.mine ?? [],
        );
      }
    } catch (error) {
      console.error(
        "Driver load error:",
        error,
      );
    }
  }, []);

  /*
   * تحديث البيانات كل 4 ثوان.
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

  /*
   * إرسال GPS السائق.
   */
  useEffect(() => {
    if (!gps) return;

    /*
     * لا نحفظ GPS سيئ جدًا.
     *
     * على الهاتف يُفترض أن تكون الدقة
     * أفضل بكثير من الكمبيوتر.
     */
    if (gps.accuracy > 1000) {
      return;
    }

    const now = Date.now();

    if (
      now -
        lastSent.current <
      10_000
    ) {
      return;
    }

    lastSent.current =
      now;

    fetch("/api/driver/profile", {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        lat: gps.lat,
        lng: gps.lng,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "GPS save failed",
          );
        }

        return response.json();
      })
      .then((data) => {
        if (data.driver) {
          setDriver(
            data.driver,
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [gps]);

  /*
   * Online / Offline.
   */
  async function toggleOnline() {
    if (!driver) return;

    /*
     * عند محاولة بدء العمل، نتأكد من وجود GPS.
     */
    if (
      !driver.isOnline &&
      !gps
    ) {
      alert(
        "يجب تشغيل GPS قبل استقبال الطلبات.",
      );

      return;
    }

    const response =
      await fetch(
        "/api/driver/profile",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isOnline:
              !driver.isOnline,

            ...(gps
              ? {
                  lat:
                    gps.lat,

                  lng:
                    gps.lng,
                }
              : {}),
          }),
        },
      );

    if (!response.ok) {
      const data =
        await response
          .json()
          .catch(() => ({}));

      alert(
        data.error ??
          "تعذر تغيير حالة الاتصال",
      );

      return;
    }

    const data =
      await response.json();

    setDriver(
      data.driver,
    );

    await load();
  }

  /*
   * قبول / استلام / توصيل.
   */
  async function act(
    id: number,
    action: string,
  ) {
    const response =
      await fetch(
        `/api/driver/jobs/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action,
          }),
        },
      );

    if (!response.ok) {
      const data =
        await response
          .json()
          .catch(() => ({}));

      alert(
        data.error ??
          "تعذر تنفيذ العملية",
      );

      await load();

      return;
    }

    await load();
  }

  /*
   * GPS المباشر أولاً.
   * DB fallback ثانيًا.
   */
  const currentPosition =
    gps
      ? {
          lat: gps.lat,
          lng: gps.lng,
        }
      : driver
        ? {
            lat:
              driver.lat,

            lng:
              driver.lng,
          }
        : null;

  /*
   * حساب مجموع الأرباح الحالية.
   */
  const currentEarnings =
    mine.reduce(
      (sum, job) =>
        sum +
        job.deliveryFee,
      0,
    );

  /*
   * Sidebar.
   */
  const nav = [
    {
      label:
        "لوحة التحكم",

      icon:
        FaHouse as IconType,

      active: true,

      href:
        "/driver",
    },

    {
      label:
        "توصيلاتي الحالية",

      icon:
        FaMotorcycle as IconType,

      href:
        "#current-jobs",
    },

    {
      label:
        "الطلبات المتاحة",

      icon:
        FaBagShopping as IconType,

      href:
        "#available-jobs",
    },

    {
      label:
        "الرئيسية",

      icon:
        FaHouse as IconType,

      href: "/",
    },
  ];

  return (
    <DashboardShell
      userLabel={name}
      userSub="سائق توصيل"
      nav={nav}
      pageTitle="لوحة السائق"
      pageSubtitle="إدارة التوصيلات والطلبات القريبة منك"
      headerExtra={
        <button
          type="button"
          onClick={
            toggleOnline
          }
          disabled={
            !driver
          }
          className={`hidden items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition disabled:opacity-50 sm:flex ${
            driver?.isOnline
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <FaPowerOff />

          <span
            className={`h-2 w-2 rounded-full ${
              driver?.isOnline
                ? "live-dot bg-white"
                : "bg-slate-400"
            }`}
          />

          {driver?.isOnline
            ? "متصل"
            : "غير متصل"}
        </button>
      }
    >
      {/*
       * =========================================================
       * Stats
       * =========================================================
       */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={
            FaMotorcycle
          }
          label="إجمالي التوصيلات"
          value={
            driver
              ? String(
                  driver.deliveriesCount,
                )
              : "..."
          }
        />

        <StatCard
          icon={FaStar}
          label="التقييم"
          value={
            driver
              ? driver.rating.toFixed(
                  1,
                )
              : "..."
          }
          badge="من 5"
        />

        <StatCard
          icon={FaBagShopping}
          label="طلبات حالية"
          value={String(
            mine.length,
          )}
        />

        <StatCard
          icon={FaRoute}
          label="طلبات متاحة"
          value={String(
            available.length,
          )}
          badge={
            driver?.isOnline
              ? "مباشر"
              : undefined
          }
        />
      </div>

      {/*
       * =========================================================
       * Driver status + GPS
       * =========================================================
       */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="حالة السائق"
          subtitle="فعّل الاتصال لاستقبال الطلبات"
          className="lg:col-span-1"
        >
          <div className="flex items-center gap-4">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl ${
                driver?.isOnline
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <FaMotorcycle />
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-900">
                {name}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                {driver
                  ?.vehicle ??
                  "دراجة نارية"}
              </p>
            </div>

            <span
              className={`h-3 w-3 shrink-0 rounded-full ${
                driver?.isOnline
                  ? "live-dot bg-emerald-500"
                  : "bg-slate-300"
              }`}
            />
          </div>

          <button
            type="button"
            onClick={
              toggleOnline
            }
            disabled={
              !driver
            }
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold transition disabled:opacity-50 ${
              driver?.isOnline
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <FaPowerOff />

            {driver?.isOnline
              ? "متصل — إيقاف"
              : "بدء استقبال الطلبات"}
          </button>
        </SectionCard>

        <SectionCard
          title="GPS والموقع"
          subtitle="موقعك الحالي المستخدم لترتيب الطلبات"
          className="lg:col-span-2"
        >
          <div
            className={`flex min-h-24 items-center gap-4 rounded-2xl p-4 ${
              gpsError
                ? "bg-amber-50"
                : gps
                  ? "bg-emerald-50"
                  : "bg-slate-50"
            }`}
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                gpsError
                  ? "bg-amber-100 text-amber-600"
                  : gps
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {gpsError ? (
                <FaTriangleExclamation />
              ) : (
                <FaLocationDot />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-black ${
                  gpsError
                    ? "text-amber-700"
                    : gps
                      ? "text-emerald-700"
                      : "text-slate-500"
                }`}
              >
                {gpsError
                  ? "مشكلة في GPS"
                  : gps
                    ? "GPS متصل"
                    : gpsLoading
                      ? "جارٍ تحديد الموقع..."
                      : "الموقع غير متوفر"}
              </p>

              {gps && (
                <>
                  <p
                    dir="ltr"
                    className="mt-1 text-start text-xs text-emerald-600"
                  >
                    {gps.lat.toFixed(
                      6,
                    )}
                    ,{" "}
                    {gps.lng.toFixed(
                      6,
                    )}
                  </p>

                  <p
                    className={`mt-1 text-[11px] ${
                      gps.accuracy >
                      1000
                        ? "font-bold text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    دقة الموقع: ±
                    {Math.round(
                      gps.accuracy,
                    )}{" "}
                    متر
                  </p>
                </>
              )}

              {gpsError && (
                <p className="mt-1 text-xs text-amber-600">
                  {gpsError}
                </p>
              )}
            </div>
          </div>

          {gps &&
            gps.accuracy >
              1000 && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                <FaTriangleExclamation className="mt-0.5 shrink-0" />

                دقة الموقع ضعيفة
                جدًا. الكمبيوتر قد
                يستخدم موقع الشبكة
                بدل GPS. اختبر على
                الهاتف مع تفعيل
                الموقع الدقيق.
              </div>
            )}
        </SectionCard>
      </div>

      {/*
       * =========================================================
       * Current deliveries
       * =========================================================
       */}
      <div
        id="current-jobs"
        className="mt-5 scroll-mt-24"
      >
        <SectionCard
          title="توصيلاتي الحالية"
          subtitle={`${mine.length} طلب قيد التنفيذ`}
        >
          {mine.length ===
          0 ? (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                <FaMotorcycle />
              </span>

              <p className="mt-3 text-sm font-bold text-slate-500">
                لا توجد توصيلات
                حالية.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                اقبل طلبًا من
                الطلبات المتاحة
                للبدء.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {mine.map(
                (job) => (
                  <div
                    key={
                      job.id
                    }
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50"
                  >
                    {/* Info */}
                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            طلب #
                            {
                              job.id
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              job.items.length
                            }{" "}
                            أصناف
                          </p>
                        </div>

                        <StatusPill
                          status={
                            job.status
                          }
                          label={
                            STATUS_LABELS[
                              job
                                .status
                            ] ??
                            job.status
                          }
                        />
                      </div>

                      {/* Pickup / destination */}
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <FaStore />
                          </span>

                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              الاستلام من
                            </p>

                            <p className="mt-1 truncate text-sm font-black text-slate-800">
                              {job.restaurantName ??
                                "المطعم"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                            <FaLocationDot />
                          </span>

                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              التسليم إلى
                            </p>

                            <p className="mt-1 truncate text-sm font-black text-slate-800">
                              {job.address ||
                                "موقع الزبون"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs">
                        <span>
                          أجر التوصيل:{" "}
                          <strong className="text-emerald-700">
                            {money(
                              job.deliveryFee,
                            )}
                          </strong>
                        </span>

                        <span className="text-slate-300">
                          |
                        </span>

                        <span>
                          المسافة:{" "}
                          <strong>
                            {
                              job.distanceKm
                            }{" "}
                            كم
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Map */}
                    {currentPosition && (
                      <div className="border-y border-slate-100">
                        <DriverMap
                          driverLat={
                            currentPosition.lat
                          }
                          driverLng={
                            currentPosition.lng
                          }
                          restaurantLat={
                            job.restaurantLat
                          }
                          restaurantLng={
                            job.restaurantLng
                          }
                          destLat={
                            job.destLat
                          }
                          destLng={
                            job.destLng
                          }
                          leg={
                            job.status ===
                            "assigned"
                              ? "pickup"
                              : "dropoff"
                          }
                          height={
                            360
                          }
                        />
                      </div>
                    )}

                    {/* Action */}
                    <div className="p-5">
                      {job.status ===
                        "assigned" && (
                        <button
                          type="button"
                          onClick={() =>
                            act(
                              job.id,
                              "pickup",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-sky-600"
                        >
                          <FaBagShopping />

                          استلمت الطلب —
                          انطلق
                        </button>
                      )}

                      {job.status ===
                        "delivering" && (
                        <button
                          type="button"
                          onClick={() =>
                            act(
                              job.id,
                              "deliver",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                        >
                          <FaCircleCheck />

                          تم التوصيل
                        </button>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/*
       * =========================================================
       * Available deliveries
       * =========================================================
       */}
      <div
        id="available-jobs"
        className="mt-5 scroll-mt-24"
      >
        <SectionCard
          title="طلبات متاحة قريبة منك"
          subtitle="الطلبات مرتبة حسب المسافة والأولوية"
        >
          {!driver?.isOnline ? (
            <div className="rounded-2xl bg-slate-50 py-10 text-center">
              <FaPowerOff className="mx-auto text-2xl text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-500">
                أنت غير متصل
              </p>

              <p className="mt-1 text-xs text-slate-400">
                فعّل الاتصال لعرض
                الطلبات القريبة.
              </p>
            </div>
          ) : available.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
              <FaClock className="mx-auto text-2xl text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-500">
                لا توجد طلبات
                حاليًا
              </p>

              <p className="mt-1 text-xs text-slate-400">
                يتم تحديث الطلبات
                كل 4 ثوان.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {available.map(
                (
                  job,
                  index,
                ) => (
                  <article
                    key={
                      job.id
                    }
                    className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-white hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">
                            طلب #
                            {
                              job.id
                            }
                          </span>

                          {index ===
                            0 && (
                            <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-700">
                              الأقرب
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {
                            job.items.length
                          }{" "}
                          أصناف
                        </p>
                      </div>

                      <span className="text-lg font-black text-emerald-600">
                        {money(
                          job.deliveryFee,
                        )}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <FaStore />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400">
                            المطعم
                          </p>

                          <p className="truncate text-sm font-bold text-slate-700">
                            {job.restaurantName ??
                              "المطعم"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                          <FaLocationDot />
                        </span>

                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400">
                            المسافة
                          </p>

                          <p className="text-sm font-bold text-slate-700">
                            {job.distToPickup ??
                              "—"}{" "}
                            كم إلى المطعم
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                      <span>
                        التوصيل
                      </span>

                      <strong className="text-slate-700">
                        {
                          job.distanceKm
                        }{" "}
                        كم
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        act(
                          job.id,
                          "accept",
                        )
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <FaCircleCheck />

                      قبول التوصيل
                    </button>
                  </article>
                ),
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}