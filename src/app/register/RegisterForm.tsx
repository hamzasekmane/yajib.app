"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { IconType } from "react-icons";
import {
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaMobileScreen,
  FaMotorcycle,
  FaSpinner,
  FaStore,
  FaUser,
  FaUtensils,
} from "react-icons/fa6";

const ROLES = [
  { key: "customer", icon: FaUser, labelKey: "roleCustomer" },
  { key: "owner", icon: FaStore, labelKey: "roleOwner" },
  { key: "driver", icon: FaMotorcycle, labelKey: "roleDriver" },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

const DEST: Record<string, string> = {
  owner: "/owner",
  driver: "/driver",
  customer: "/",
};

const CHEVRON = "polygon(0 0, 55% 0, 100% 50%, 55% 100%, 0 100%, 45% 50%)";

function IconInput({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: IconType }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-4 ps-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
      />
    </div>
  );
}

export default function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") ?? "customer";

  const [role, setRole] = useState<RoleKey>(
    ROLES.some((r) => r.key === initialRole) ? (initialRole as RoleKey) : "customer",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        password,
        role,
        restaurantName,
        cuisine,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("registerFailed"));
      return;
    }
    router.push(DEST[data.role] ?? "/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-bl from-emerald-600 via-emerald-600 to-teal-500 px-5 py-10">
      {/* ديكور شيفرون مطابق للهيرو */}
      <div
        className="absolute -bottom-10 -left-10 h-64 w-40 bg-lime-400/15"
        style={{ clipPath: CHEVRON }}
      />
      <div
        className="absolute -right-10 -top-10 h-64 w-40 bg-white/10"
        style={{ clipPath: CHEVRON }}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl md:p-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-black tracking-tight"
        >
          <FaMotorcycle className="text-emerald-600" />
          <span>
            <span className="text-emerald-600">yajib</span>
            <span className="text-slate-900">.app</span>
          </span>
        </Link>

        <h1 className="mt-6 text-2xl font-black text-slate-900">
          {t("registerTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("registerSubtitle")}</p>

        {/* اختيار الدور — تابات مثل HeroCard */}
        <div className="mt-5 grid grid-cols-3 border-b border-slate-100">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={`flex flex-col items-center gap-1 pb-3 pt-1 text-xs font-extrabold transition ${
                role === r.key
                  ? "border-b-2 border-emerald-600 text-emerald-700"
                  : "border-b-2 border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <r.icon className="text-lg" />
              {t(r.labelKey)}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <IconInput
            icon={FaUser}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            aria-label={t("name")}
            required
          />
          <IconInput
            icon={FaMobileScreen}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phone")}
            aria-label={t("phone")}
            required
          />

          <div className="relative">
            <FaLock className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              aria-label={t("password")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-11 ps-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              aria-label="Toggle password"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {role === "owner" && (
            <>
              <IconInput
                icon={FaStore}
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder={t("restaurantName")}
                aria-label={t("restaurantName")}
                required
              />
              <IconInput
                icon={FaUtensils}
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder={t("cuisine")}
                aria-label={t("cuisine")}
              />
            </>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading && <FaSpinner className="animate-spin" />}
            {t("register")}
            {!loading && <FaArrowLeft className="text-xs ltr:rotate-180" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-extrabold text-emerald-600 hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}