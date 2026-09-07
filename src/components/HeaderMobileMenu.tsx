"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FaBars,
  FaChartLine,
  FaMotorcycle,
  FaRightFromBracket,
  FaXmark,
} from "react-icons/fa6";

import LocaleSwitcher from "@/components/LocaleSwitcher";

type HeaderTranslations = {
  services: string;
  restaurants: string;
  partners: string;
  registerRestaurant: string;
  beDriver: string;
  welcome: string;
  login: string;
  dashboard: string;
  logout: string;
  role: string;
};

type HeaderUser = {
  name: string;
  role: string;
} | null;

export default function HeaderMobileMenu({
  user,
  dashboardHref,
  translations,
}: {
  user: HeaderUser;
  dashboardHref: string;
  translations: HeaderTranslations;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <LocaleSwitcher />

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-600"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <FaBars className="text-xl" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
          />

          {/* Mobile drawer */}
          <aside className="absolute inset-y-0 end-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-2 text-xl font-black tracking-tight"
              >
                <FaMotorcycle className="text-emerald-600" />
                <span>
                  <span className="text-emerald-600">yajib</span>
                  <span className="text-slate-900">.app</span>
                </span>
              </Link>

              <button
                type="button"
                onClick={closeMenu}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close menu"
              >
                <FaXmark className="text-xl" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-5">
              <MobileLink href="/#services" onClick={closeMenu}>
                {translations.services}
              </MobileLink>

              <MobileLink href="/#restaurants" onClick={closeMenu}>
                {translations.restaurants}
              </MobileLink>

              <MobileLink href="/#partners" onClick={closeMenu}>
                {translations.partners}
              </MobileLink>

              <div className="my-4 border-t border-slate-100" />

              <MobileLink href="/register?role=owner" onClick={closeMenu}>
                {translations.registerRestaurant}
              </MobileLink>

              <MobileLink href="/register?role=driver" onClick={closeMenu}>
                {translations.beDriver}
              </MobileLink>

              <div className="my-4 border-t border-slate-100" />

              {user ? (
                <>
                  <div className="mb-2 rounded-2xl bg-emerald-50 p-4">
                    <p className="font-bold text-emerald-800">
                      {translations.welcome}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-600">
                      {translations.role}
                    </p>
                  </div>

                  <MobileLink
                    href={dashboardHref}
                    onClick={closeMenu}
                    icon={FaChartLine}
                  >
                    {translations.dashboard}
                  </MobileLink>

                  {/* هذا فقط يغلق القائمة حالياً. اربطه بـ API/logout لاحقاً */}
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-start text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <FaRightFromBracket />
                    {translations.logout}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="mt-1 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                >
                  {translations.login}
                </Link>
              )}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}

function MobileLink({
  href,
  children,
  onClick,
  icon: Icon,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
  icon?: IconType;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
    >
      {Icon ? <Icon className="text-emerald-600" /> : null}
      {children}
    </Link>
  );
}