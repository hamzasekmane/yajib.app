"use client";

import { useState } from "react";
import {
  FaCircleCheck,
  FaLocationCrosshairs,
  FaLocationDot,
  FaSpinner,
  FaTriangleExclamation,
} from "react-icons/fa6";

interface Props {
  initialLat: number;
  initialLng: number;
}

export default function OwnerLocationCard({
  initialLat,
  initialLng,
}: Props) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function updateLocation() {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }

    setLoading(true);
    setSaved(false);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;

        try {
          const res = await fetch("/api/owner/location", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: nextLat,
              lng: nextLng,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(
              data.error ?? "تعذر حفظ موقع المطعم.",
            );
            return;
          }

          setLat(data.restaurant.lat);
          setLng(data.restaurant.lng);

          setSaved(true);
        } catch {
          setError("تعذر الاتصال بالخادم.");
        } finally {
          setLoading(false);
        }
      },

      (geoError) => {
        setLoading(false);

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(
              "تم رفض إذن الموقع. فعّل GPS من إعدادات المتصفح.",
            );
            break;

          case geoError.POSITION_UNAVAILABLE:
            setError("موقع الجهاز غير متوفر.");
            break;

          case geoError.TIMEOUT:
            setError("استغرق تحديد الموقع وقتًا طويلًا.");
            break;

          default:
            setError("تعذر تحديد موقع المطعم.");
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  }

  return (
    <div className="mb-5 rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FaLocationDot />
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-900">
              موقع المطعم
            </h2>

            <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
              حدّد مكان المطعم الحقيقي حتى يستطيع السائق الوصول إلى
              نقطة الاستلام.
            </p>

            <div
              dir="ltr"
              className="mt-2 text-xs font-medium text-slate-400"
            >
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={updateLocation}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              جارٍ تحديد الموقع...
            </>
          ) : (
            <>
              <FaLocationCrosshairs />
              تحديد موقع المطعم
            </>
          )}
        </button>
      </div>

      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          <FaCircleCheck />
          تم حفظ موقع المطعم بنجاح.
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
          <FaTriangleExclamation className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}