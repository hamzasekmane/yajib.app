export const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار المطعم",
  accepted: "تم القبول",
  preparing: "قيد التحضير",
  ready: "جاهز للاستلام",
  assigned: "تم تعيين سائق",
  delivering: "فى الطريق إليك",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-sky-100 text-sky-700",
  preparing: "bg-indigo-100 text-indigo-700",
  ready: "bg-purple-100 text-purple-700",
  assigned: "bg-cyan-100 text-cyan-700",
  delivering: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export function money(n: number): string {
  return `${n.toFixed(2)} ر.س`;
}
