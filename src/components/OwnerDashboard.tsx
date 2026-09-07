// components/OwnerDashboard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import type { IconType } from "react-icons";
import {
  FaChartPie,
  FaCircleCheck,
  FaClock,
  FaGlobe,
  FaHouse,
  FaPlus,
  FaSackDollar,
  FaTrashCan,
  FaUtensils,
  FaClipboardList,
  FaChevronLeft,
} from "react-icons/fa6";
import DashboardShell from "@/components/DashboardShell";
import {
  Bars,
  Donut,
  SectionCard,
  Sparkline,
  StatCard,
  StatusPill,
  STATUS_DOT,
} from "@/components/dashboard/ui";
import { STATUS_LABELS, money } from "@/lib/status";

type Line = { id: number; name: string; price: number; qty: number };
interface OwnerOrder {
  id: number;
  status: string;
  items: Line[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  distanceKm: number;
  address: string;
  customerName: string | null;
  customerPhone: string | null;
}
interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  emoji: string | null;
}

const NEXT_ACTION: Record<string, { status: string; label: string }[]> = {
  pending: [
    { status: "accepted", label: "قبول" },
    { status: "cancelled", label: "رفض" },
  ],
  accepted: [{ status: "preparing", label: "بدء التحضير" }],
  preparing: [{ status: "ready", label: "جاهز للاستلام" }],
};

const ACTION_BTN: Record<string, string> = {
  cancelled:
    "bg-rose-50 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-100",
  default: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700",
};

export default function OwnerDashboard({
  restaurantName,
  slug,
}: {
  restaurantName: string;
  slug: string;
}) {
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/owner/orders");
    if (!res.ok) return;
    const data = await res.json();
    setOrders(data.orders ?? []);
    setPendingCount(data.pendingCount ?? 0);
  }, []);

  const loadMenu = useCallback(async () => {
    const res = await fetch(`/api/restaurants/${slug}`);
    if (!res.ok) return;
    const data = await res.json();
    setMenu(data.menu ?? []);
  }, [slug]);

  useEffect(() => {
    loadOrders();
    if (slug) loadMenu();
    const t = setInterval(loadOrders, 4000);
    return () => clearInterval(t);
  }, [loadOrders, loadMenu, slug]);

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/owner/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  /* بيانات مشتقة حقيقية من الطلبات */
  const delivered = orders.filter((o) => o.status === "delivered");
  const totalRevenue = delivered.reduce((s, o) => s + o.total, 0);
  const completionPct = orders.length
    ? Math.round((delivered.length / orders.length) * 100)
    : 0;

  let acc = 0;
  const cumulative = delivered.map((o) => (acc += o.total));
  const sparkData = cumulative.length >= 2 ? cumulative : [0, ...cumulative, 0];

  const recentOrders = orders.slice(-8);
  const barsData = recentOrders.map((o) => o.total);
  const barsLabels = recentOrders.map((o) => `#${o.id}`);

  const statusCounts = orders.reduce<Record<string, number>>((m, o) => {
    m[o.status] = (m[o.status] ?? 0) + 1;
    return m;
  }, {});
  const donutSegments = Object.entries(statusCounts).map(([status, value]) => ({
    label: STATUS_LABELS[status] ?? status,
    value,
    color: STATUS_DOT[status] ?? "#94a3b8",
  }));

  const nav = [
    { label: "الطلبات", icon: FaClipboardList as IconType, active: tab === "orders", onClick: () => setTab("orders") },
    { label: "القائمة", icon: FaUtensils as IconType, active: tab === "menu", onClick: () => setTab("menu") },
    ...(slug
      ? [{ label: "صفحة المطعم", icon: FaGlobe as IconType, href: `/r/${slug}` }]
      : []),
    { label: "الصفحة الرئيسية", icon: FaHouse as IconType, href: "/" },
  ];

  return (
    <DashboardShell
      userLabel={restaurantName}
      userSub="حساب مطعم"
      nav={nav}
      pageTitle={tab === "orders" ? "إدارة الطلبات" : "إدارة القائمة"}
      pageSubtitle={slug ? `yajib.app/r/${slug}` : undefined}
      headerExtra={
        slug ? (
          <a
            href={`/r/${slug}`}
            className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 sm:flex"
          >
            <FaGlobe />
            معاينة الصفحة
          </a>
        ) : undefined
      }
    >
      {/* ===== كروت الإحصائيات ===== */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={FaClock} label="طلبات فى الطابور" value={String(pendingCount)} badge="مباشر" />
        <StatCard icon={FaClipboardList} label="إجمالى الطلبات" value={String(orders.length)} />
        <StatCard
          icon={FaCircleCheck}
          label="طلبات مكتملة"
          value={String(delivered.length)}
          badge={`${completionPct}% من الكل`}
        />
        <StatCard icon={FaSackDollar} label="الإيرادات" value={money(totalRevenue)} />
      </div>

      {tab === "orders" ? (
        <>
          {/* ===== الرسوم البيانية ===== */}
          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <SectionCard
              title="منحنى الإيرادات"
              subtitle="تراكمي للطلبات المكتملة"
              className="xl:col-span-2"
            >
              <Sparkline data={sparkData} />
            </SectionCard>

            <SectionCard title="توزيع الطلبات" subtitle="حسب الحالة">
              {donutSegments.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  لا توجد بيانات بعد.
                </p>
              ) : (
                <Donut segments={donutSegments} />
              )}
            </SectionCard>
          </div>

          {/* ===== الطلبات + قائمة جانبية ===== */}
          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <SectionCard
              title="الطلبات الأخيرة"
              subtitle={`${orders.length} طلب · التحديث تلقائي كل 4 ثوانٍ`}
              className="xl:col-span-2"
              bodyClassName="max-h-[560px] overflow-y-auto"
            >
              {orders.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  لا توجد طلبات بعد.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center gap-3 py-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-500">
                        #{o.id}
                      </span>

                      <div className="min-w-36 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">
                          {o.customerName ?? "زبون"}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {o.customerPhone}
                          {o.address ? ` · ${o.address}` : ""}
                        </p>
                      </div>

                      <p className="hidden max-w-52 truncate text-xs text-slate-500 lg:block">
                        {o.items
                          .slice(0, 2)
                          .map((l) => `${l.name} ×${l.qty}`)
                          .join("، ")}
                        {o.items.length > 2 ? ` +${o.items.length - 2}` : ""}
                      </p>

                      <StatusPill status={o.status} label={STATUS_LABELS[o.status] ?? o.status} />

                      <span className="text-sm font-black text-emerald-600">
                        {money(o.total)}
                      </span>

                      {NEXT_ACTION[o.status] && (
                        <div className="flex w-full gap-2 md:w-auto">
                          {NEXT_ACTION[o.status].map((a) => (
                            <button
                              key={a.status}
                              onClick={() => updateStatus(o.id, a.status)}
                              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                                ACTION_BTN[a.status === "cancelled" ? "cancelled" : "default"]
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {o.status === "ready" && (
                        <p className="w-full text-[11px] font-bold text-amber-600">
                          ⏳ بانتظار سائق لاستلام الطلب…
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* أعمدة المبيعات + أصناف القائمة */}
            <div className="space-y-5">
              <SectionCard title="قيمة الطلبات" subtitle="آخر 8 طلبات">
                {barsData.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">لا توجد بيانات.</p>
                ) : (
                  <Bars data={barsData} labels={barsLabels} />
                )}
              </SectionCard>

              <SectionCard
                title="أصناف القائمة"
                action={
                  <button
                    onClick={() => setTab("menu")}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    إدارة
                    <FaChevronLeft className="text-[10px]" />
                  </button>
                }
              >
                <ul className="space-y-3">
                  {menu.slice(0, 5).map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                        {m.emoji ?? "🍽️"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-400">{m.category}</p>
                      </div>
                      <span className="text-sm font-black text-emerald-600">
                        {money(m.price)}
                      </span>
                    </li>
                  ))}
                  {menu.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">
                      لا توجد أصناف بعد.
                    </p>
                  )}
                </ul>
              </SectionCard>
            </div>
          </div>
        </>
      ) : (
        <MenuManager menu={menu} onChange={loadMenu} />
      )}
    </DashboardShell>
  );
}

/* ================= إدارة القائمة ================= */

function MenuManager({
  menu,
  onChange,
}: {
  menu: MenuItem[];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("رئيسى");
  const [emoji, setEmoji] = useState("🍔");
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/owner/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: parseFloat(price), category, emoji }),
    });
    setSaving(false);
    setName("");
    setPrice("");
    onChange();
  }

  async function remove(id: number) {
    await fetch(`/api/owner/menu?id=${id}`, { method: "DELETE" });
    onChange();
  }

  const inputCls =
    "rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white";

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-3">
      {/* نموذج الإضافة */}
      <SectionCard title="إضافة صنف جديد" className="xl:col-span-1">
        <form onSubmit={add} className="space-y-3">
          <div className="grid grid-cols-[64px_1fr] gap-3">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className={`${inputCls} text-center text-lg`}
              placeholder="🍔"
              aria-label="الأيقونة"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="اسم الصنف"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              step="0.5"
              className={inputCls}
              placeholder="السعر"
              required
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
              placeholder="التصنيف"
            />
          </div>
          <button
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <FaPlus />
            {saving ? "جارٍ الإضافة…" : "إضافة الصنف"}
          </button>
        </form>
      </SectionCard>

      {/* قائمة الأصناف */}
      <SectionCard
        title="أصناف القائمة"
        subtitle={`${menu.length} صنف`}
        className="xl:col-span-2"
        bodyClassName="max-h-[560px] overflow-y-auto"
      >
        {menu.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            لا توجد أصناف بعد — أضف أول صنف من النموذج الجانبي.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {menu.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  {m.emoji ?? "🍽️"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">{m.name}</p>
                  <p className="text-[11px] text-slate-400">{m.category}</p>
                </div>
                <span className="text-sm font-black text-emerald-600">
                  {money(m.price)}
                </span>
                <button
                  onClick={() => remove(m.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                >
                  <FaTrashCan />
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}