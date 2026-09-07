// app/page.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FaApple,
  FaArrowLeft,
  FaBagShopping,
  FaBasketShopping,
  FaBolt,
  FaChartLine,
  FaChevronLeft,
  FaCircleCheck,
  FaClock,
  FaCoins,
  FaFacebookF,
  FaGlobe,
  FaGooglePlay,
  FaHandHoldingDollar,
  FaInstagram,
  FaLocationCrosshairs,
  FaLocationDot,
  FaMagnifyingGlass,
  FaMobileScreenButton,
  FaMotorcycle,
  FaPersonRunning,
  FaPizzaSlice,
  FaRegBell,
  FaShieldHalved,
  FaStore,
  FaTags,
  FaTiktok,
  FaTruckFast,
  FaUser,
  FaUserClock,
  FaUtensils,
  FaYoutube,
} from "react-icons/fa6";

import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import Background3DSection from "@/components/Background3DSection";
import FloatingPhone from "@/components/FloatingPhone";

export const dynamic = "force-dynamic";

const CHEVRON = "polygon(0 0, 55% 0, 100% 50%, 55% 100%, 0 100%, 45% 50%)";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

type Stat = { value: string; label: string };
type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

function SectionBadge({
  icon: Icon,
  children,
  dark = false,
}: {
  icon?: IconType;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
        dark ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {Icon && <Icon className="text-sm" />}
      {children}
    </span>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
  dark = false,
}: {
  icon?: IconType;
  title: string;
  desc: string;
  dark?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {Icon && (
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            dark ? "bg-white/10 text-lime-300" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <Icon />
        </span>
      )}
      <div>
        <p className={`font-extrabold ${dark ? "text-white" : "text-slate-900"}`}>
          {title}
        </p>
        <p
          className={`mt-1 text-sm leading-relaxed ${
            dark ? "text-white/60" : "text-slate-500"
          }`}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

function StoreButtons({
  getItOn,
  downloadOn,
}: {
  getItOn: string;
  downloadOn: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <a
        href="#"
        className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2.5 text-white transition hover:bg-slate-700"
      >
        <FaGooglePlay className="text-lg" />
        <span className="text-start leading-tight">
          <span className="block text-[10px] text-white/60">{getItOn}</span>
          <span className="block text-sm font-extrabold">Google Play</span>
        </span>
      </a>
      <a
        href="#"
        className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2.5 text-white transition hover:bg-slate-700"
      >
        <FaApple className="text-lg" />
        <span className="text-start leading-tight">
          <span className="block text-[10px] text-white/60">{downloadOn}</span>
          <span className="block text-sm font-extrabold">App Store</span>
        </span>
      </a>
    </div>
  );
}

function Tile({
  src,
  icon: Icon,
  className = "",
}: {
  src?: string;
  icon?: IconType;
  className?: string;
}) {
  return (
    <div
      className={`relative min-h-[180px] overflow-hidden rounded-3xl bg-emerald-700 ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-6xl text-white">
          {Icon && <Icon />}
        </div>
      )}
    </div>
  );
}

function PillLink({
  href,
  children,
  tone = "green",
}: {
  href: string;
  children: ReactNode;
  tone?: "green" | "white" | "lime";
}) {
  const tones = {
    green: "bg-emerald-600 text-white hover:bg-emerald-700",
    white: "bg-white text-slate-900 hover:bg-slate-100",
    lime: "bg-lime-400 text-slate-900 hover:bg-lime-300",
  } as const;
  return (
    <Link
      href={href}
      className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold shadow-lg transition ${tones[tone]}`}
    >
      {children}
      <FaArrowLeft className="text-xs ltr:rotate-180" />
    </Link>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return <div className={className} style={{ clipPath: CHEVRON }} />;
}

export default async function HomePage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  const list = await db.select().from(restaurants);

  const stats = t.raw("stats.items") as Stat[];
  const actions = t.raw("simplify.actions") as string[];
  const slogan = t.raw("moving.slogan") as string[];
  const platforms = t.raw("social.platforms") as string[];
  const footerColumns = t.raw("footer.columns") as FooterColumn[];

  const actionIcons: IconType[] = [FaUtensils, FaBagShopping, FaStore];
  const socialIcons: IconType[] = [FaFacebookF, FaInstagram, FaTiktok, FaYoutube];

  return (
    <div className="min-h-screen bg-white">
      {/* ===== الهيدر ===== */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
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

          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-700 lg:flex">
            <Link href="/#services" className="transition hover:text-emerald-600">
              {t("header.services")}
            </Link>
            <Link href="/#restaurants" className="transition hover:text-emerald-600">
              {t("header.restaurants")}
            </Link>
            <Link href="/#partners" className="transition hover:text-emerald-600">
              {t("header.partners")}
            </Link>
            <Link href="/register?role=owner" className="transition hover:text-emerald-600">
              {t("header.registerRestaurant")}
            </Link>
            <Link href="/register?role=driver" className="transition hover:text-emerald-600">
              {t("header.beDriver")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            {user ? (
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 sm:block">
                {t("header.welcome", { name: user.name })}
              </span>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                {t("header.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ===== الهيرو مع خلفية الـ 3D Particles والهاتف المتحرك ===== */}
      <Background3DSection>
        <div className="grid items-center gap-14 md:grid-cols-2">
          {/* الهاتف المتحرك 3D */}
          <div className="flex items-center justify-center">
            <FloatingPhone />
          </div>

          {/* نص + شيفرونات */}
          <div>
            <h2 className="text-3xl font-black leading-snug md:text-5xl">
              {t("simplify.titleStart")}
              <span className="text-emerald-400">{t("simplify.titleHighlight")}</span>
              {t("simplify.titleEnd")}
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/70">
              {t("simplify.subtitle")}
            </p>

            <div className="relative mt-12 flex w-fit">
              <Chevron className="h-40 w-24 bg-lime-400" />
              <Chevron className="-ml-6 h-40 w-24 bg-emerald-500" />
              <Chevron className="-ml-6 h-40 w-24 bg-emerald-700" />
              <Chevron className="-ml-6 h-40 w-24 bg-emerald-900" />
              <FaPersonRunning className="absolute -top-12 right-10 text-7xl text-white drop-shadow-xl" />
            </div>
          </div>
        </div>
      </Background3DSection>

      {/* ===== الخدمات (الأخضر الكبير) ===== */}
      <section id="services" className="bg-emerald-600 py-16 text-white md:py-24">
        <div className="mx-auto max-w-6xl space-y-6 px-5">
          <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className="rounded-3xl bg-white p-8 text-slate-900 md:p-10">
              <SectionBadge icon={FaPizzaSlice}>
                {t("services.foodBadge")}
              </SectionBadge>
              <h3 className="mt-4 text-2xl font-black md:text-3xl">
                {t("services.foodTitle")}
              </h3>
              <div className="mt-6 space-y-5">
                <Feature
                  icon={FaBolt}
                  title={t("services.foodF1Title")}
                  desc={t("services.foodF1Desc")}
                />
                <Feature
                  icon={FaShieldHalved}
                  title={t("services.foodF2Title")}
                  desc={t("services.foodF2Desc")}
                />
                <Feature
                  icon={FaTags}
                  title={t("services.foodF3Title")}
                  desc={t("services.foodF3Desc")}
                />
              </div>
              <StoreButtons
                getItOn={t("stores.getItOn")}
                downloadOn={t("stores.downloadOn")}
              />
            </div>

            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              <Tile src={img("1565299624946-b28f40a0ae38")} className="row-span-2" />
              <Tile src={img("1504674900247-0877df9cc836")} />
              <Tile src={img("1567620905732-2d1ec7ab7445")} />
            </div>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <Tile src={img("1558981403-c5f9899a28bc")} />
            <div className="rounded-3xl bg-white p-8 text-slate-900 md:p-10">
              <SectionBadge icon={FaMotorcycle}>
                {t("services.driverBadge")}
              </SectionBadge>
              <h3 className="mt-4 text-2xl font-black md:text-3xl">
                {t("services.driverTitle")}
              </h3>
              <div className="mt-6 space-y-5">
                <Feature
                  icon={FaUserClock}
                  title={t("services.driverF1Title")}
                  desc={t("services.driverF1Desc")}
                />
                <Feature
                  icon={FaMobileScreenButton}
                  title={t("services.driverF2Title")}
                  desc={t("services.driverF2Desc")}
                />
                <Feature
                  icon={FaHandHoldingDollar}
                  title={t("services.driverF3Title")}
                  desc={t("services.driverF3Desc")}
                />
              </div>
              <PillLink href="/register?role=driver">
                {t("services.driverCta")}
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      {/* ===== الإحصائيات ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
          <div className="relative">
            <div className="absolute -left-8 bottom-2 hidden h-28 w-24 -skew-x-12 rounded-2xl bg-emerald-100 md:block" />
            <h2 className="relative text-4xl font-black leading-[1.35] text-slate-900 md:text-5xl">
              {t("stats.titleLine1")}
              <br />
              {t("stats.titleLine2Start")}
              <span className="text-emerald-600">{t("stats.titleLine2Highlight")}</span>
            </h2>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-3xl bg-slate-100/80 p-7">
                  <div className="text-3xl font-black text-emerald-600 md:text-4xl">
                    {s.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xl font-black text-emerald-600 shadow-xl ring-1 ring-slate-100">
                <FaMotorcycle />
                yajib
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== المطاعم من قاعدة البيانات ===== */}
      <section id="restaurants" className="bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-end justify-between">
            <div>
              <SectionBadge icon={FaUtensils}>{t("restaurants.badge")}</SectionBadge>
              <h2 className="mt-3 text-3xl font-black text-slate-900">
                {t("restaurants.title")}
              </h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-500 shadow-sm">
              {t("restaurants.count", { count: list.length })}
            </span>
          </div>

          {list.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              {t("restaurants.empty")}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((r) => (
                <Link
                  key={r.id}
                  href={`/r/${r.slug}`}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className="flex h-32 items-center justify-center text-5xl text-white"
                    style={{ backgroundColor: r.logoColor ?? "#059669" }}
                  >
                    <FaUtensils />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900">{r.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                          r.isOpen
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {r.isOpen && <FaCircleCheck className="text-[10px]" />}
                        {r.isOpen ? t("restaurants.open") : t("restaurants.closed")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{r.cuisine}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-extrabold text-emerald-600 group-hover:underline">
                      {t("restaurants.browseMenu")}
                      <FaArrowLeft className="text-xs ltr:rotate-180" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== سيكشن داكن: أصحاب المطاعم + الزبائن ===== */}
      <section className="bg-[#0B1210] py-16 text-white md:py-24">
        <div className="mx-auto max-w-6xl space-y-6 px-5">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              <Tile src={img("1517248135467-4c7edcad34c4")} className="row-span-2" />
              <Tile src={img("1555396273-367ea4eb4db5")} />
              <Tile src={img("1540189549336-e6e99c3679fe")} />
            </div>
            <div className="rounded-3xl bg-white p-8 text-slate-900 md:p-10">
              <SectionBadge icon={FaStore}>{t("owners.badge")}</SectionBadge>
              <h3 className="mt-4 text-2xl font-black md:text-3xl">
                {t("owners.title")}
              </h3>
              <div className="mt-6 space-y-5">
                <Feature
                  icon={FaGlobe}
                  title={t("owners.f1Title")}
                  desc={t("owners.f1Desc")}
                />
                <Feature
                  icon={FaChartLine}
                  title={t("owners.f2Title")}
                  desc={t("owners.f2Desc")}
                />
                <Feature
                  icon={FaMotorcycle}
                  title={t("owners.f3Title")}
                  desc={t("owners.f3Desc")}
                />
              </div>
              <PillLink href="/register?role=owner">{t("owners.cta")}</PillLink>
            </div>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 text-slate-900 md:p-10">
              <SectionBadge icon={FaUser}>{t("customers.badge")}</SectionBadge>
              <h3 className="mt-4 text-2xl font-black md:text-3xl">
                {t("customers.title")}
              </h3>
              <div className="mt-6 space-y-5">
                <Feature
                  icon={FaMagnifyingGlass}
                  title={t("customers.f1Title")}
                  desc={t("customers.f1Desc")}
                />
                <Feature
                  icon={FaLocationCrosshairs}
                  title={t("customers.f2Title")}
                  desc={t("customers.f2Desc")}
                />
                <Feature
                  icon={FaTags}
                  title={t("customers.f3Title")}
                  desc={t("customers.f3Desc")}
                />
              </div>
              <PillLink href="#restaurants">{t("customers.cta")}</PillLink>
            </div>

            <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-3xl bg-emerald-600">
              <Chevron className="absolute -left-6 top-1/2 h-56 w-32 -translate-y-1/2 bg-lime-400/30" />
              <div className="relative flex items-center gap-4 text-white drop-shadow-2xl">
                <FaMotorcycle className="text-8xl" />
                <FaPizzaSlice className="text-6xl text-lime-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== المواهب / الشركاء / الأعمال + موبايل التتبع ===== */}
      <section id="partners" className="bg-emerald-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid items-center gap-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-10 lg:grid-cols-2">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {t("join.talentsTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {t("join.talentsDesc")}
                </p>
                <PillLink href="#">{t("join.talentsCta")}</PillLink>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {t("join.driversTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {t("join.driversDesc")}
                </p>
                <PillLink href="/register?role=driver">
                  {t("join.driversCta")}
                </PillLink>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {t("join.businessTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {t("join.businessDesc")}
                </p>
                <PillLink href="/register?role=owner">
                  {t("join.businessCta")}
                </PillLink>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[300px]">
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-3 shadow-2xl">
                <div className="overflow-hidden rounded-[2rem]">
                  <div className="relative h-72 bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100">
                    <div className="absolute left-0 top-10 h-3 w-[140%] -rotate-6 bg-white" />
                    <div className="absolute left-0 top-28 h-2.5 w-[140%] rotate-3 bg-white/80" />
                    <div className="absolute left-0 top-44 h-3 w-[140%] -rotate-2 bg-white" />
                    <div className="absolute -left-6 top-0 h-[140%] w-3 rotate-12 bg-white/70" />
                    <div className="absolute left-24 top-0 h-[140%] w-2.5 -rotate-6 bg-white/60" />
                    <div className="absolute right-16 top-10 h-36 -rotate-[20deg] border-r-4 border-dashed border-emerald-500" />
                    <FaLocationDot className="absolute right-6 top-5 text-2xl text-emerald-600" />
                    <FaStore className="absolute bottom-14 left-8 text-2xl text-slate-700" />
                    <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-slate-700 shadow">
                      <span className="live-dot h-2 w-2 rounded-full bg-emerald-500" />
                      <FaMotorcycle className="text-emerald-600" />
                      {t("track.onTheWay")}
                    </div>
                  </div>

                  <div className="space-y-2 bg-white p-3">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        <FaClock className="text-emerald-600" />
                        {t("track.etaLabel")}
                      </span>
                      <span className="text-emerald-600">{t("track.etaValue")}</span>
                    </div>
                    <div className="rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-extrabold text-white">
                      {t("track.detailsCta")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== كروت "نتقدّم معًا" ===== */}
      <section id="business" className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-2">
          <div className="relative min-h-[340px] overflow-hidden rounded-3xl bg-[#0B1210] p-8 text-white">
            <div className="absolute inset-y-0 -left-8 w-48 -skew-x-12 bg-emerald-600" />
            <div className="absolute inset-y-0 left-32 w-8 -skew-x-12 bg-lime-400" />
            <div className="absolute bottom-8 left-5 text-2xl font-black leading-snug">
              {slogan.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <div className="relative max-w-[62%]">
              <SectionBadge dark icon={FaBasketShopping}>
                {t("moving.groceryBadge")}
              </SectionBadge>
              <h3 className="mt-4 text-2xl font-black">{t("moving.groceryTitle")}</h3>
              <div className="mt-6 space-y-4">
                <Feature
                  dark
                  icon={FaBolt}
                  title={t("moving.groceryF1Title")}
                  desc={t("moving.groceryF1Desc")}
                />
                <Feature
                  dark
                  icon={FaBagShopping}
                  title={t("moving.groceryF2Title")}
                  desc={t("moving.groceryF2Desc")}
                />
                <Feature
                  dark
                  icon={FaTags}
                  title={t("moving.groceryF3Title")}
                  desc={t("moving.groceryF3Desc")}
                />
              </div>
              <PillLink tone="lime" href="#">
                <FaRegBell />
                {t("moving.groceryCta")}
              </PillLink>
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden rounded-3xl bg-[#0B1210] p-8 text-white">
            <div className="absolute inset-y-0 -left-8 w-48 -skew-x-12 bg-lime-400" />
            <div className="absolute inset-y-0 left-32 w-8 -skew-x-12 bg-emerald-600" />
            <div className="absolute bottom-8 left-5 text-2xl font-black leading-snug text-slate-900">
              {slogan.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <div className="relative max-w-[62%]">
              <SectionBadge dark icon={FaTruckFast}>
                {t("moving.fleetBadge")}
              </SectionBadge>
              <h3 className="mt-4 text-2xl font-black">{t("moving.fleetTitle")}</h3>
              <div className="mt-6 space-y-4">
                <Feature
                  dark
                  icon={FaShieldHalved}
                  title={t("moving.fleetF1Title")}
                  desc={t("moving.fleetF1Desc")}
                />
                <Feature
                  dark
                  icon={FaChartLine}
                  title={t("moving.fleetF2Title")}
                  desc={t("moving.fleetF2Desc")}
                />
                <Feature
                  dark
                  icon={FaCoins}
                  title={t("moving.fleetF3Title")}
                  desc={t("moving.fleetF3Desc")}
                />
              </div>
              <PillLink tone="white" href="#">
                {t("moving.fleetCta")}
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      {/* ===== السوشيال ===== */}
      <section className="bg-emerald-600 px-5 py-16 md:py-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-[#0B1210] px-6 py-16 text-center text-white">
          <Chevron className="absolute -left-6 -top-10 h-40 w-24 bg-lime-400/20" />
          <Chevron className="absolute -bottom-10 -right-6 h-40 w-24 bg-emerald-500/20" />
          <h2 className="text-3xl font-black">{t("social.title")}</h2>
          <p className="mt-3 text-white/70">{t("social.subtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {platforms.map((label, i) => {
              const Icon = socialIcons[i];
              return (
                <a
                  key={label}
                  href="#"
                  className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/25 transition hover:bg-white/20"
                >
                  <Icon className="text-lime-300" />
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== الفوتر ===== */}
      <footer className="bg-[#0B1210] pb-10 pt-16 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-10 md:grid-cols-[1.1fr_2fr]">
            <div>
              <div className="flex items-center gap-2 text-2xl font-black">
                <FaMotorcycle className="text-emerald-400" />
                <span>
                  <span className="text-emerald-400">yajib</span>
                  <span className="text-white">.app</span>
                </span>
              </div>
              <StoreButtons
                getItOn={t("stores.getItOn")}
                downloadOn={t("stores.downloadOn")}
              />
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <p className="text-sm font-black">{col.title}</p>
                  <ul className="mt-4 space-y-3 text-sm text-white/60">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="transition hover:text-emerald-400"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50">
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <FaLocationDot className="text-emerald-400" />
                {t("footer.country")}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">
                {t("footer.language")}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="hover:text-white">{t("footer.privacy")}</a>
              <a href="#" className="hover:text-white">{t("footer.terms")}</a>
              <a href="#" className="hover:text-white">{t("footer.cookies")}</a>
            </div>
            <div>© yajib {new Date().getFullYear()}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}