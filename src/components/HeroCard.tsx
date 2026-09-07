"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FaLocationDot,
  FaMotorcycle,
  FaPizzaSlice,
  FaStore,
} from "react-icons/fa6";

const TABS = [
  { key: "food", icon: FaPizzaSlice, href: "#restaurants" },
  { key: "owner", icon: FaStore, href: "/register?role=owner" },
  { key: "driver", icon: FaMotorcycle, href: "/register?role=driver" },
] as const;

export default function HeroCard() {
  const t = useTranslations("hero");
  const [active, setActive] = useState(0);
  const tab = TABS[active];
  const key = tab.key;

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl md:p-7">
      {/* التابات مثل Yassir */}
      <div className="grid grid-cols-3 border-b border-slate-100">
        {TABS.map((x, i) => (
          <button
            key={x.key}
            onClick={() => setActive(i)}
            className={`flex flex-col items-center gap-1 pb-3 pt-1 text-xs font-extrabold transition ${
              i === active
                ? "border-b-2 border-emerald-600 text-emerald-700"
                : "border-b-2 border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <x.icon className="text-lg" />
            {t(`tabs.${x.key}.label`)}
          </button>
        ))}
      </div>

      <h1 className="mt-5 text-2xl font-black leading-snug text-slate-900 md:text-[1.7rem]">
        {t(`tabs.${key}.title`)}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {t(`tabs.${key}.desc`)}
      </p>

      <label className="mt-5 block text-sm font-extrabold text-slate-700">
        {t(`tabs.${key}.fieldLabel`)}
      </label>
      <div className="relative mt-2">
        <FaLocationDot className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder={t(`tabs.${key}.placeholder`)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-4 ps-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
        />
      </div>

      <Link
        href={tab.href}
        className="mt-4 block rounded-full bg-emerald-600 py-3.5 text-center text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700"
      >
        {t(`tabs.${key}.cta`)}
      </Link>
    </div>
  );
}