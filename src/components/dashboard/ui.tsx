// components/dashboard/ui.tsx
import type { ReactNode } from "react";
import type { IconType } from "react-icons";

/* ألوان حالات الطلبات — ثيم أخضر */
export const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-sky-100 text-sky-700",
  preparing: "bg-violet-100 text-violet-700",
  ready: "bg-lime-100 text-lime-700",
  assigned: "bg-cyan-100 text-cyan-700",
  delivering: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export const STATUS_DOT: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#0ea5e9",
  preparing: "#8b5cf6",
  ready: "#84cc16",
  assigned: "#06b6d4",
  delivering: "#10b981",
  delivered: "#059669",
  cancelled: "#f43f5e",
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
        STATUS_PILL[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: IconType;
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon />
        </span>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-black text-slate-900">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white ring-1 ring-slate-100 ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={`px-5 pb-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

/* رسم مساحي (Area) — SVG خالص */
export function Sparkline({ data, height = 150 }: { data: number[]; height?: number }) {
  const w = 600;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = height - 18 - ((v - min) / range) * (height - 36);
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className="h-40 w-full"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path
        d={line}
        fill="none"
        stroke="#059669"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.length > 0 && (
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="5"
          fill="#059669"
          stroke="white"
          strokeWidth="2.5"
        />
      )}
    </svg>
  );
}

/* رسم أعمدة */
export function Bars({ data, labels }: { data: number[]; labels?: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
        >
          <div
            className="w-full max-w-9 rounded-t-lg bg-emerald-500 transition-all"
            style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
          />
          <span className="truncate text-[10px] text-slate-400">
            {labels?.[i] ?? `#${i + 1}`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* رسم دائري (Donut) */
export function Donut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 60;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-36 w-36 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#eef2f1" strokeWidth="18" />
        {segments.map((s) => {
          const frac = s.value / total;
          const dash = `${frac * C} ${C}`;
          const off = -acc * C;
          acc += frac;
          return (
            <circle
              key={s.label}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={off}
            />
          );
        })}
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
            <span className="font-black text-slate-900">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}