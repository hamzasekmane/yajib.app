// components/DriverDashboard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type { IconType } from "react-icons";
import {
  FaBagShopping,
  FaChartPie,
  FaCircleCheck,
  FaHouse,
  FaLocationDot,
  FaMotorcycle,
  FaPowerOff,
  FaStar,
  FaStore,
} from "react-icons/fa6";
import dynamic from "next/dynamic";
import DashboardShell from "@/components/DashboardShell";
import { SectionCard, StatCard, StatusPill } from "@/components/dashboard/ui";
import { STATUS_LABELS, money } from "@/lib/status";

const DriverMap = dynamic(() => import("@/components/DriverMap"), {
  ssr: false,
});

type Line = { id: number; name: string; price: number; qty: number };
interface Job {
  id: number;
  status: string;
  items: Line[];
  total: number;
  deliveryFee: number;
  distanceKm: number;
  address: string;
  restaurantName: string | null;
  distToPickup?: number;
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

export default function DriverDashboard({ name }: { name: string }) {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [available, setAvailable] = useState<Job[]>([]);
  const [mine, setMine] = useState<Job[]>([]);

  const load = useCallback(async () => {
    const [pRes, jRes] = await Promise.all([
      fetch("/api/driver/profile"),
      fetch("/api/driver/jobs"),
    ]);
    if (pRes.ok) setDriver((await pRes.json()).driver);
    if (jRes.ok) {
      const d = await jRes.json();
      setAvailable(d.available ?? []);
      setMine(d.mine ?? []);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  async function toggleOnline() {
    if (!driver) return;
    await fetch("/api/driver/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: !driver.isOnline }),
    });
    load();
  }

  async function act(id: number, action: string) {
    await fetch(`/api/driver/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  const nav = [
    { label: "لوحة التحكم", icon: FaChartPie as IconType, active: true },
    { label: "توصيلاتى", icon: FaBagShopping as IconType, href: "#mine" },
    { label: "الطلبات المتاحة", icon: FaMotorcycle as IconType, href: "#available" },
    { label: "الصفحة الرئيسية", icon: FaHouse as IconType, href: "/" },
  ];

  return (
    <DashboardShell
      userLabel={name}
      userSub="سائق شريك"
      nav={nav}
      pageTitle="لوحة السائق"
      pageSubtitle="الطلبات القريبة تُرتّب بخوارزمية الإسناد الذكية (MinHeap)"
    >
      {/* ===== الملف الشخصي + حالة الاتصال + الإحصائيات ===== */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* كارت الاتصال */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-black text-white">
              {name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{name}</p>
              <p className="text-[11px] text-slate-400">
                {driver?.vehicle ?? "دراجة"} · سائق yajib
              </p>
            </div>
            <span
              className={`ms-auto h-2.5 w-2.5 rounded-full ${
                driver?.isOnline ? "bg-emerald-500 live-dot" : "bg-slate-300"
              }`}
            />
          </div>

          <button
            onClick={toggleOnline}
            disabled={!driver}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold transition disabled:opacity-60 ${
              driver?.isOnline
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <FaPowerOff />
            {driver?.isOnline ? "متصل — تستقبل طلبات" : "غير متصل — اضغط للاتصال"}
          </button>
        </div>

        <StatCard
          icon={FaMotorcycle}
          label="إجمالى التوصيلات"
          value={driver ? String(driver.deliveriesCount) : "…"}
        />
        <StatCard
          icon={FaStar}
          label="تقييم الزبائن"
          value={driver ? `⭐ ${driver.rating.toFixed(1)}` : "…"}
          badge={driver?.isOnline ? "متصل الآن" : undefined}
        />
      </div>

      {/* ===== توصيلاتى الحالية ===== */}
      <div id="mine" className="mt-5 scroll-mt-24">
        {mine.length > 0 && (
          <SectionCard title="توصيلاتى الحالية" subtitle={`${mine.length} طلب جارٍ`}>
            <div className="space-y-4">
              {mine.map((j) => (
                <div
                  key={j.id}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-black text-slate-900">
                      طلب #{j.id}
                    </span>
                    <StatusPill
                      status={j.status}
                      label={STATUS_LABELS[j.status] ?? j.status}
                    />
                  </div>

                  {/* المسار: المطعم → الزبون */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-emerald-100">
                        <FaStore />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">الاستلام من</p>
                        <p className="truncate text-sm font-bold text-slate-900">
                          {j.restaurantName ?? "المطعم"}
                        </p>
                      </div>
                    </div>
                    <div className="ms-4 h-4 border-s-2 border-dashed border-emerald-300" />
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-emerald-100">
                        <FaLocationDot />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">التسليم إلى</p>
                        <p className="truncate text-sm font-bold text-slate-900">
                          {j.address || "عنوان الزبون"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {j.items.map((l) => `${l.name} ×${l.qty}`).join("، ")}
                  </p>

                  <p className="mt-2 text-sm font-black text-emerald-700">
                    أجر التوصيل: {money(j.deliveryFee)} · {j.distanceKm} كم
                  </p>

                  {driver && (
                    <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-emerald-100">
                      <DriverMap
                        driverLat={driver.lat}
                        driverLng={driver.lng}
                        restaurantLat={24.7136}
                        restaurantLng={46.6753}
                        destLat={24.72}
                        destLng={46.69}
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    {j.status === "assigned" && (
                      <button
                        onClick={() => act(j.id, "pickup")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 text-sm font-extrabold text-white transition hover:bg-sky-600"
                      >
                        <FaBagShopping />
                        استلمت الطلب — انطلق
                      </button>
                    )}
                    {j.status === "delivering" && (
                      <button
                        onClick={() => act(j.id, "deliver")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700"
                      >
                        <FaCircleCheck />
                        تم التوصيل ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* ===== الطلبات المتاحة ===== */}
      <div id="available" className="mt-5 scroll-mt-24">
        <SectionCard
          title="طلبات متاحة قريبة منك"
          subtitle="مرتّبة بخوارزمية الأولوية (الأقرب أولاً — MinHeap)"
        >
          {!driver?.isOnline ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              فعّل حالة &quot;متصل&quot; من الأعلى لاستقبال الطلبات.
            </p>
          ) : available.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              لا توجد طلبات جاهزة حالياً. ترقّب… 👀
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {available.map((j, i) => (
                <div
                  key={j.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition hover:bg-white hover:ring-1 hover:ring-emerald-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-black text-slate-900">
                      طلب #{j.id}
                      {i === 0 && (
                        <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-700">
                          الأقرب لك
                        </span>
                      )}
                    </span>
                    <span className="text-base font-black text-emerald-600">
                      {money(j.deliveryFee)}
                    </span>
                  </div>

                  <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <FaStore className="text-emerald-600" />
                    {j.restaurantName ?? "المطعم"}
                  </p>
                  {j.address && (
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <FaLocationDot className="text-slate-400" />
                      {j.address}
                    </p>
                  )}

                  <p className="mt-2 text-[11px] text-slate-400">
                    إلى المطعم: {j.distToPickup ?? "—"} كم · مسافة التوصيل:{" "}
                    {j.distanceKm} كم
                  </p>

                  <button
                    onClick={() => act(j.id, "accept")}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700"
                  >
                    <FaCircleCheck />
                    قبول التوصيل
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}