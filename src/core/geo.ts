/** إحداثيات جغرافية */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * خوارزمية Haversine — حساب المسافة بالكيلومتر بين نقطتين على سطح الأرض.
 * تُستخدم لتقدير مسافة التوصيل واختيار أقرب سائق.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * حساب رسوم التوصيل بناءً على المسافة.
 * رسوم أساسية + سعر لكل كيلومتر.
 */
export function calcDeliveryFee(distanceKm: number): number {
  const BASE = 5;
  const PER_KM = 1.5;
  return Math.round((BASE + distanceKm * PER_KM) * 100) / 100;
}
