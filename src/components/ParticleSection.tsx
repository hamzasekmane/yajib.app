// components/ParticleSection.tsx
"use client";

import dynamic from "next/dynamic";
import React from "react";
import { FaBolt } from "react-icons/fa6";

const ParticleRing = dynamic(() => import("@/components/ParticleRing"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] w-full items-center justify-center rounded-3xl bg-slate-900 text-emerald-400 font-bold">
      جاري تحميل المنظومة ثلاثية الأبعاد...
    </div>
  ),
});

export default function ParticleSection() {
  return (
    <section className="bg-slate-900 py-16 md:py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="mx-auto max-w-6xl px-5 relative z-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-emerald-400">
            <FaBolt className="text-sm" />
            تقنية التوصيل الذكية
          </span>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
            منظومة التوصيل التفاعلية ثلاثية الأبعاد 🛵
          </h2>
          <p className="mt-2 text-slate-300 max-w-lg mx-auto text-sm leading-relaxed">
            استكشف محاكاة مسارات التوصيل الفورية وكيفية ربط المطاعم والسائقين بالعملاء بأقصى سرعة وكفاءة.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <ParticleRing />
        </div>
      </div>
    </section>
  );
}