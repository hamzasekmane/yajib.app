import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FaChartLine, FaMotorcycle } from "react-icons/fa6";

import HeaderMobileMenu from "@/components/HeaderMobileMenu";
import LocaleSwitcher from "@/components/LocaleSwitcher";

type HeaderUser = {
  name: string;
  role: string;
} | null;

export default async function SiteHeader({ user }: { user: HeaderUser }) {
  const t = await getTranslations("header");
  const tNav = await getTranslations("nav");

  const dashboardHref =
    user?.role === "owner"
      ? "/dashboard/owner"
      : user?.role === "driver"
        ? "/dashboard/driver"
        : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-2xl font-black tracking-tight"
        >
          <FaMotorcycle className="text-emerald-600" />
          <span>
            <span className="text-emerald-600">yajib</span>
            <span className="text-slate-900">.app</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-700 xl:flex">
          <Link href="/#services" className="transition hover:text-emerald-600">
            {t("services")}
          </Link>

          <Link href="/#restaurants" className="transition hover:text-emerald-600">
            {t("restaurants")}
          </Link>

          <Link href="/#partners" className="transition hover:text-emerald-600">
            {t("partners")}
          </Link>

          <Link
            href="/register?role=owner"
            className="transition hover:text-emerald-600"
          >
            {t("registerRestaurant")}
          </Link>

          <Link
            href="/register?role=driver"
            className="transition hover:text-emerald-600"
          >
            {t("beDriver")}
          </Link>

          {user && (
            <Link
              href={dashboardHref}
              className="flex items-center gap-1.5 text-emerald-700 transition hover:text-emerald-500"
            >
              <FaChartLine className="text-xs" />
              {tNav("dashboard")}
            </Link>
          )}
        </nav>

        {/* Desktop account actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />

          {user ? (
            <Link
              href={dashboardHref}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              {t("welcome", {
                name: user.name.split(" ")[0] || user.name,
              })}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              {t("login")}
            </Link>
          )}
        </div>

        {/* Mobile navigation */}
        <HeaderMobileMenu
          user={user}
          dashboardHref={dashboardHref}
          translations={{
            services: t("services"),
            restaurants: t("restaurants"),
            partners: t("partners"),
            registerRestaurant: t("registerRestaurant"),
            beDriver: t("beDriver"),
            welcome: user ? t("welcome", { name: user.name }) : "",
            login: t("login"),
            dashboard: tNav("dashboard"),
            logout: tNav("logout"),
            role: user?.role ?? "",
          }}
        />
      </div>
    </header>
  );
}