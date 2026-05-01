import React, { useEffect, useRef, useState } from "react";
import { Store } from "../types";

interface YandexMapProps {
  store: Store;
  height?: string;
}

declare global {
  interface Window {
    ymaps: any;
    ymapsReady: boolean;
  }
}

const loadYmaps = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.ymaps && window.ymapsReady) { resolve(); return; }
    if (document.getElementById("ymaps-script")) {
      const check = setInterval(() => {
        if (window.ymapsReady) { clearInterval(check); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "ymaps-script";
    script.src = "https://api-maps.yandex.ru/2.1/?apikey=&lang=uz_UZ";
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => {
        window.ymapsReady = true;
        resolve();
      });
    };
    document.head.appendChild(script);
  });
};

const YandexMap: React.FC<YandexMapProps> = ({ store, height = "220px" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      try {
        await loadYmaps();
        if (destroyed || !mapRef.current) return;

        // Destroy previous map instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        const { lat, lng } = store.coordinates;

        const map = new window.ymaps.Map(mapRef.current, {
          center: [lat, lng],
          zoom: 15,
          controls: ["zoomControl"],
        });

        const placemark = new window.ymaps.Placemark(
          [lat, lng],
          {
            balloonContentHeader: store.name,
            balloonContentBody: store.address,
            hintContent: store.name,
          },
          {
            preset: "islands#orangeShopIcon",
          }
        );

        map.geoObjects.add(placemark);
        mapInstanceRef.current = map;
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    init();

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.destroy(); } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [store]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100" style={{ height }}>
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading state */}
      {loading && !error && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-2">
          <svg className="w-6 h-6 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-xs text-gray-400">Xarita yuklanmoqda...</p>
        </div>
      )}

      {/* Error state - fallback to Yandex Maps link */}
      {error && (
        <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 text-center">{store.address}</p>
          <a
            href={`https://yandex.uz/maps/?ll=${store.coordinates.lng},${store.coordinates.lat}&z=15&pt=${store.coordinates.lng},${store.coordinates.lat},pm2rdm`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-500 font-semibold hover:underline flex items-center gap-1"
          >
            Yandex Xaritada ochish
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Open in Yandex Maps button */}
      {!loading && !error && (
        <a
          href={`https://yandex.uz/maps/?ll=${store.coordinates.lng},${store.coordinates.lat}&z=15&pt=${store.coordinates.lng},${store.coordinates.lat},pm2rdm`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 bg-white text-xs text-gray-600 font-medium px-3 py-1.5 rounded-xl shadow-md hover:shadow-lg hover:text-orange-500 transition-all flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Yandex Xaritada ochish
        </a>
      )}
    </div>
  );
};

export default YandexMap;
