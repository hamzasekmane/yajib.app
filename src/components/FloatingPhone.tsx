// components/FloatingPhone.tsx
"use client";

import { motion } from "framer-motion";

import { FiBatteryCharging, FiWifi } from "react-icons/fi";
import { FaMotorcycle } from "react-icons/fa6";
import Link from "next/link";
import { useTranslations } from "next-intl"; // استيراد الترجمة للـ Client Components

const FloatingPhone = () => {
  return (
    <div
      style={{
        transformStyle: "preserve-3d",
        transform: "rotateY(-30deg) rotateX(15deg)",
      }}
      className="rounded-[24px] bg-emerald-500"
    >
      <motion.div
        initial={{
          transform: "translateZ(8px) translateY(-2px)",
        }}
        animate={{
          transform: "translateZ(32px) translateY(-8px)",
        }}
        transition={{
          repeat: Infinity,
          repeatType: "mirror",
          duration: 2,
          ease: "easeInOut",
        }}
        className="relative h-96 w-56 rounded-[24px] border-2 border-b-4 border-r-4 border-white border-l-slate-300 border-t-slate-300 bg-[#0B1210] p-1 pl-[3px] pt-[3px]"
      >
        <HeaderBar />
        <Screen />
      </motion.div>
    </div>
  );
};

const HeaderBar = () => {
  return (
    <>
      <div className="absolute left-[50%] top-2.5 z-10 h-2 w-16 -translate-x-[50%] rounded-md bg-[#0B1210]"></div>
      <div className="absolute right-3 top-2 z-10 flex gap-2">
        <FiWifi className="text-slate-500" />
        <FiBatteryCharging className="text-slate-500" />
      </div>
    </>
  );
};

const Screen = () => {
  const t = useTranslations(); // تهيئة الترجمة

  return (
    <div className="relative z-0 flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[20px] bg-white">
      {/* شعار تطبيق yajib.app */}
      <FaMotorcycle className="text-5xl text-emerald-500" />
      <span className="mt-2 text-sm font-black text-slate-900">
        <span className="text-emerald-600">yajib</span>.app
      </span>

      <Link
        href="#services"
        className="absolute bottom-4 left-4 right-4 z-10 rounded-lg border-[1px] bg-white py-2 text-center text-sm font-bold text-emerald-600 shadow-sm transition hover:bg-emerald-50"
      >
        {t("simplify.cta")} {/* استخدام متغير الترجمة */}
      </Link>

      {/* دائرة الضوء الخلفية */}
      <div className="absolute -bottom-72 left-[50%] h-96 w-96 -translate-x-[50%] rounded-full bg-emerald-500" />
    </div>
  );
};

export default FloatingPhone;