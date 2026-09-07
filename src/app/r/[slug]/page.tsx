import { notFound } from "next/navigation";
import Link from "next/link";

import { db } from "@/db";
import {
  restaurants,
  menuItems,
} from "@/db/schema";

import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

import {
  FaArrowLeft,
  FaLocationDot,
  FaUtensils,
} from "react-icons/fa6";

import SiteHeader from "@/components/SiteHeader";
import RestaurantMenu from "./RestaurantMenu";

export const dynamic = "force-dynamic";

const CHEVRON =
  "polygon(0 0, 55% 0, 100% 50%, 55% 100%, 0 100%, 45% 50%)";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(
      eq(
        restaurants.slug,
        slug,
      ),
    )
    .limit(1);

  if (!restaurant) {
    notFound();
  }

  const menu = await db
    .select()
    .from(menuItems)
    .where(
      eq(
        menuItems.restaurantId,
        restaurant.id,
      ),
    );

  const user = await getCurrentUser();

  const t = await getTranslations(
    "rpage",
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader
        user={
          user
            ? {
                name: user.name,
                role: user.role,
              }
            : null
        }
      />

      {/* Restaurant Hero */}
      <section className="relative overflow-hidden">
        <div
          className="flex h-44 items-center justify-center text-7xl text-white md:h-56"
          style={{
            backgroundColor:
              restaurant.logoColor ??
              "#059669",
          }}
        >
          <FaUtensils />
        </div>

        <div
          className="absolute -bottom-8 -left-6 h-40 w-24 bg-white/10"
          style={{
            clipPath: CHEVRON,
          }}
        />

        <div
          className="absolute -top-10 right-8 h-32 w-20 bg-black/5"
          style={{
            clipPath: CHEVRON,
          }}
        />
      </section>

      {/* Restaurant info */}
      <div className="mx-auto max-w-4xl px-5">
        <div className="relative -mt-10 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100 md:p-8">
          <Link
            href="/#restaurants"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-emerald-600"
          >
            <FaArrowLeft className="text-[10px] ltr:rotate-180" />
            {t("backToRestaurants")}
          </Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                {restaurant.name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {restaurant.cuisine}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                restaurant.isOpen
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  restaurant.isOpen
                    ? "live-dot bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />

              {restaurant.isOpen
                ? t("openNow")
                : t("closed")}
            </span>
          </div>

          {restaurant.description && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {restaurant.description}
            </p>
          )}

          {/* الموقع محفوظ في المطعم */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <FaLocationDot className="text-emerald-600" />

            <span>
              موقع المطعم مسجل لخدمة التوصيل
            </span>
          </div>
        </div>
      </div>

      <RestaurantMenu
        restaurantId={restaurant.id}
        restaurantLat={restaurant.lat}
        restaurantLng={restaurant.lng}
        isOpen={restaurant.isOpen}
        menu={menu}
        canOrder={
          user?.role ===
          "customer"
        }
        isLoggedIn={!!user}
      />
    </div>
  );
}