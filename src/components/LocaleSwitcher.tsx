"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IoLanguage } from "react-icons/io5";

const LABELS: Record<string, string> = {
  ar: "🇸🇦 العربية",
  fr: "🇫🇷 Français",
  en: "🇬🇧 English",
};

export default function LocaleSwitcher() {
  const locale = useLocale(); // القيمة الحقيقية من السيرفر
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function changeLocale(next: string) {
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="relative flex items-center">
      <IoLanguage className="pointer-events-none absolute start-3 text-lg text-slate-400" />
      <select
        aria-label="Change language"
        disabled={isPending}
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
        className="appearance-none rounded-full border border-slate-200 bg-white py-2 pe-4 ps-9 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-500 disabled:opacity-60"
      >
        {Object.entries(LABELS).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}