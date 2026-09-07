// components/DashboardShell.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaBell,
  FaMotorcycle,
} from "react-icons/fa6";

export type NavItem = {
  label: string;
  icon: IconType;
  active?: boolean;
  onClick?: () => void;
  href?: string;
};

export default function DashboardShell({
  userLabel,
  userSub,
  nav,
  pageTitle,
  pageSubtitle,
  headerExtra,
  children,
}: {
  userLabel: string;
  userSub?: string;
  nav: NavItem[];
  pageTitle: string;
  pageSubtitle?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#0B2E22] text-white">
      {/* اللوغو */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
          <FaMotorcycle />
        </span>
        <span className="text-lg font-black">
          yajib<span className="text-emerald-400">-App</span>
        </span>
      </div>

      {/* روابط التنقل */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const inner = (
            <>
              <item.icon className="text-base" />
              {item.label}
            </>
          );
          const cls = `flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            item.active
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`;
          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cls}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
              className={cls}
            >
              {inner}
            </button>
          );
        })}
      </nav>

      {/* الخروج */}
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-300 transition hover:bg-white/5"
        >
          <FaArrowRightFromBracket />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F8F6] text-slate-900">
      {/* السايدبار — ثابت على الديسكتوب (يظهر يمينًا تلقائيًا في RTL) */}
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>

      {/* درج الموبايل */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 start-0">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* التوب بار */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-xl p-2 text-slate-500 ring-1 ring-slate-200 lg:hidden"
              aria-label="القائمة"
            >
              <FaBars />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black leading-tight">
                {pageTitle}
              </h1>
              {pageSubtitle && (
                <p className="truncate text-xs text-slate-500">{pageSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {headerExtra}
            <button
              className="relative rounded-xl p-2.5 text-slate-500 ring-1 ring-slate-200 transition hover:text-emerald-600"
              aria-label="الإشعارات"
            >
              <FaBell />
              <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </button>
            <div className="flex items-center gap-2.5 rounded-xl bg-white py-1.5 pe-4 ps-1.5 ring-1 ring-slate-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">
                {userLabel.charAt(0)}
              </span>
              <span className="hidden sm:block">
                <span className="block max-w-32 truncate text-xs font-black leading-tight">
                  {userLabel}
                </span>
                {userSub && (
                  <span className="block text-[10px] text-slate-400">{userSub}</span>
                )}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-7 lg:py-7">{children}</main>
      </div>
    </div>
  );
}