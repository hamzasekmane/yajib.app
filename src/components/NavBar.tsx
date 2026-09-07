"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  owner: "/owner",
  driver: "/driver",
  customer: "/orders",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "لوحة المطعم",
  driver: "لوحة السائق",
  customer: "طلباتى",
};

export function NavBar({
  user,
}: {
  user: { name: string; role: string } | null;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-black">
          <span className="text-orange-500">yajib</span>
          <span className="text-slate-400">.app</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href={ROLE_HOME[user.role] ?? "/"}
                className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
              >
                {ROLE_LABEL[user.role]}
              </Link>
              <span className="hidden text-slate-400 sm:inline">
                مرحباً، {user.name}
              </span>
              <button
                onClick={logout}
                className="rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
              >
                خروج
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
              >
                دخول
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600"
              >
                حساب جديد
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
