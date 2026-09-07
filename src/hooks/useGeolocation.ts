"use client";

import { useEffect, useState } from "react";

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

export function useGeolocation(enabled = true) {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setError(null);
        setLoading(false);
      },

      (geoError) => {
        setLoading(false);

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(
              "تم رفض إذن الموقع. فعّل Location من إعدادات المتصفح.",
            );
            break;

          case geoError.POSITION_UNAVAILABLE:
            setError("تعذر تحديد موقع الجهاز.");
            break;

          case geoError.TIMEOUT:
            setError("انتهت مهلة تحديد الموقع.");
            break;

          default:
            setError("تعذر تحديد موقعك.");
        }
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  return {
    coords,
    error,
    loading,
  };
}