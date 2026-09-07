"use client";

import type { IconType } from "react-icons";

import {
  FaBagShopping,
  FaBurger,
  FaCartShopping,
  FaHouse,
  FaLocationDot,
  FaMotorcycle,
  FaReceipt,
  FaStore,
  FaUser,
} from "react-icons/fa6";

import DashboardShell from "@/components/DashboardShell";
import OrdersList from "./OrdersList";

export default function CustomerOrdersDashboard({
  name,
  title,
  subtitle,
}: {
  name: string;
  title: string;
  subtitle: string;
}) {
  const nav = [
    {
      label: "الرئيسية",
      icon: FaHouse as IconType,
      href: "/",
    },

    {
      label: "طلباتي",
      icon: FaReceipt as IconType,
      href: "/orders",
      active: true,
    },

    {
      label: "المطاعم",
      icon: FaStore as IconType,
      href: "/#restaurants",
    },

    {
      label: "اطلب طعام",
      icon: FaBurger as IconType,
      href: "/#restaurants",
    },
  ];

  return (
    <DashboardShell
      userLabel={name}
      userSub="حساب زبون"
      nav={nav}
      pageTitle={title}
      pageSubtitle={subtitle}
    >
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-700 to-emerald-500 p-6 text-white shadow-lg shadow-emerald-600/10 md:p-8">
        {/* decoration */}
        <div className="absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-lime-300/10" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-100">
              <FaUser />
              مرحباً {name}
            </div>

            <h2 className="mt-3 text-2xl font-black md:text-3xl">
              ماذا تريد أن تأكل اليوم؟
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
              تصفّح المطاعم القريبة، اطلب طعامك وتابع السائق
              مباشرة حتى يصل طلبك.
            </p>

            <a
              href="/#restaurants"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-50"
            >
              <FaBurger />
              اطلب الآن
            </a>
          </div>

          <div className="hidden h-28 w-28 items-center justify-center rounded-3xl bg-white/10 text-5xl backdrop-blur md:flex">
            <FaMotorcycle />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickCard
          icon={FaReceipt}
          title="طلباتي"
          description="تتبع طلباتك"
          href="/orders"
          color="emerald"
        />

        <QuickCard
          icon={FaStore}
          title="المطاعم"
          description="تصفح المطاعم"
          href="/#restaurants"
          color="sky"
        />

        <QuickCard
          icon={FaCartShopping}
          title="اطلب الآن"
          description="اختر وجبتك"
          href="/#restaurants"
          color="amber"
        />

        <QuickCard
          icon={FaLocationDot}
          title="توصيل مباشر"
          description="تتبع السائق"
          href="#orders-list"
          color="violet"
        />
      </div>

      {/* Orders */}
      <section
        id="orders-list"
        className="mt-6 scroll-mt-24"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              طلباتك
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              يتم تحديث حالة الطلب وموقع السائق تلقائياً.
            </p>
          </div>

          <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" />
            تحديث مباشر
          </span>
        </div>

        <OrdersList />
      </section>
    </DashboardShell>
  );
}

/* =========================================================
   Quick Card
   ========================================================= */

function QuickCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: IconType;
  title: string;
  description: string;
  href: string;

  color:
    | "emerald"
    | "sky"
    | "amber"
    | "violet";
}) {
  const colors = {
    emerald: {
      box: "bg-emerald-50 text-emerald-600",
      hover: "hover:border-emerald-100",
    },

    sky: {
      box: "bg-sky-50 text-sky-600",
      hover: "hover:border-sky-100",
    },

    amber: {
      box: "bg-amber-50 text-amber-600",
      hover: "hover:border-amber-100",
    },

    violet: {
      box: "bg-violet-50 text-violet-600",
      hover: "hover:border-violet-100",
    },
  };

  const theme = colors[color];

  return (
    <a
      href={href}
      className={`group rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${theme.hover}`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.box}`}
      >
        <Icon />
      </span>

      <h3 className="mt-3 text-sm font-black text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </a>
  );
}