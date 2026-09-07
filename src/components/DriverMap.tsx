"use client";

import {
  useEffect,
  useRef,
} from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

interface DriverMapProps {
  driverLat?:
    | number
    | null;

  driverLng?:
    | number
    | null;

  restaurantLat?:
    | number
    | null;

  restaurantLng?:
    | number
    | null;

  destLat?:
    | number
    | null;

  destLng?:
    | number
    | null;

  leg?:
    | "pickup"
    | "dropoff";

  height?: number;
}

function pin(
  emoji: string,
  background: string,
) {
  return L.divIcon({
    html: `
      <span
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:40px;
          height:40px;
          border-radius:9999px;
          background:${background};
          font-size:18px;
          border:3px solid white;
          box-shadow:0 5px 15px rgba(0,0,0,.25);
        "
      >
        ${emoji}
      </span>
    `,

    className: "",

    iconSize: [
      40,
      40,
    ],

    iconAnchor: [
      20,
      20,
    ],
  });
}

async function getRoute(
  points: [
    number,
    number,
  ][],
) {
  try {
    const coordinates =
      points
        .map(
          ([lat, lng]) =>
            `${lng},${lat}`,
        )
        .join(";");

    const response =
      await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
      );

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    if (
      data.code !== "Ok" ||
      !data.routes?.[0]
    ) {
      return null;
    }

    return data.routes[0]
      .geometry
      .coordinates.map(
        (
          coordinate: [
            number,
            number,
          ],
        ) =>
          [
            coordinate[1],
            coordinate[0],
          ] as [
            number,
            number,
          ],
      );
  } catch {
    return null;
  }
}

export default function DriverMap({
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  destLat,
  destLng,
  leg = "pickup",
  height = 320,
}: DriverMapProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  const mapRef =
    useRef<L.Map | null>(
      null,
    );

  const markerLayerRef =
    useRef<L.LayerGroup | null>(
      null,
    );

  const routeRef =
    useRef<L.Polyline | null>(
      null,
    );

  useEffect(() => {
    if (
      !containerRef.current
    ) {
      return;
    }

    if (!mapRef.current) {
      const firstLat =
        driverLat ??
        restaurantLat ??
        destLat ??
        24.7136;

      const firstLng =
        driverLng ??
        restaurantLng ??
        destLng ??
        46.6753;

      const map = L.map(
        containerRef.current,
      ).setView(
        [
          firstLat,
          firstLng,
        ],
        14,
      );

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,

          attribution:
            "&copy; OpenStreetMap contributors",
        },
      ).addTo(map);

      mapRef.current =
        map;

      markerLayerRef.current =
        L.layerGroup().addTo(
          map,
        );
    }

    const map =
      mapRef.current;

    const markerLayer =
      markerLayerRef.current;

    if (
      !map ||
      !markerLayer
    ) {
      return;
    }

    markerLayer.clearLayers();

    if (
      routeRef.current
    ) {
      routeRef.current.remove();

      routeRef.current =
        null;
    }

    const allPoints: [
      number,
      number,
    ][] = [];

    if (
      driverLat != null &&
      driverLng != null
    ) {
      const driverPoint: [
        number,
        number,
      ] = [
        driverLat,
        driverLng,
      ];

      allPoints.push(
        driverPoint,
      );

      L.marker(
        driverPoint,
        {
          icon: pin(
            "🛵",
            "#059669",
          ),
          zIndexOffset:
            1000,
        },
      )
        .addTo(
          markerLayer,
        )
        .bindPopup(
          "موقع السائق",
        );
    }

    if (
      restaurantLat != null &&
      restaurantLng != null
    ) {
      const restaurantPoint: [
        number,
        number,
      ] = [
        restaurantLat,
        restaurantLng,
      ];

      allPoints.push(
        restaurantPoint,
      );

      L.marker(
        restaurantPoint,
        {
          icon: pin(
            "🍽️",
            "#0f766e",
          ),
        },
      )
        .addTo(
          markerLayer,
        )
        .bindPopup(
          "المطعم",
        );
    }

    if (
      destLat != null &&
      destLng != null
    ) {
      const destinationPoint: [
        number,
        number,
      ] = [
        destLat,
        destLng,
      ];

      allPoints.push(
        destinationPoint,
      );

      L.marker(
        destinationPoint,
        {
          icon: pin(
            "🏠",
            "#f59e0b",
          ),
        },
      )
        .addTo(
          markerLayer,
        )
        .bindPopup(
          "الزبون",
        );
    }

    if (
      allPoints.length > 0
    ) {
      const bounds =
        L.latLngBounds(
          allPoints,
        );

      map.fitBounds(
        bounds,
        {
          padding: [
            45,
            45,
          ],
          maxZoom: 16,
        },
      );
    }

    let routePoints: [
      number,
      number,
    ][] = [];

    /*
     * قبل استلام الطعام:
     *
     * السائق -> المطعم
     */
    if (
      leg === "pickup" &&
      driverLat != null &&
      driverLng != null &&
      restaurantLat != null &&
      restaurantLng != null
    ) {
      routePoints = [
        [
          driverLat,
          driverLng,
        ],

        [
          restaurantLat,
          restaurantLng,
        ],
      ];
    }

    /*
     * بعد الاستلام:
     *
     * السائق -> الزبون
     */
    if (
      leg === "dropoff" &&
      driverLat != null &&
      driverLng != null &&
      destLat != null &&
      destLng != null
    ) {
      routePoints = [
        [
          driverLat,
          driverLng,
        ],

        [
          destLat,
          destLng,
        ],
      ];
    }

    let cancelled =
      false;

    if (
      routePoints.length >=
      2
    ) {
      getRoute(
        routePoints,
      ).then(
        (route) => {
          if (
            cancelled ||
            !mapRef.current
          ) {
            return;
          }

          if (
            routeRef.current
          ) {
            routeRef.current.remove();
          }

          if (route) {
            routeRef.current =
              L.polyline(
                route,
                {
                  color:
                    "#059669",

                  weight: 6,

                  opacity:
                    0.9,

                  lineCap:
                    "round",

                  lineJoin:
                    "round",
                },
              ).addTo(
                mapRef.current,
              );
          } else {
            routeRef.current =
              L.polyline(
                routePoints,
                {
                  color:
                    "#059669",

                  weight: 4,

                  opacity:
                    0.7,

                  dashArray:
                    "8 8",
                },
              ).addTo(
                mapRef.current,
              );
          }
        },
      );
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      cancelled = true;
    };
  }, [
    driverLat,
    driverLng,
    restaurantLat,
    restaurantLng,
    destLat,
    destLng,
    leg,
  ]);

  /*
   * إزالة Leaflet بالكامل عند unmount
   */
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();

        mapRef.current =
          null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height,
      }}
      className="z-0 w-full overflow-hidden rounded-2xl"
    />
  );
}