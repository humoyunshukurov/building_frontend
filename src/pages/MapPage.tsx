import React, { useEffect, useRef, useState } from "react";
import { storesApi } from "../api/api";
import { Store } from "../types";

declare global {
  interface Window { ymaps: any; ymapsReady: boolean; }
}

const loadYmaps = (): Promise<void> =>
  new Promise((resolve) => {
    if (window.ymaps && window.ymapsReady) { resolve(); return; }
    if (document.getElementById("ymaps-script")) {
      const check = setInterval(() => { if (window.ymapsReady) { clearInterval(check); resolve(); } }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "ymaps-script";
    script.src = "https://api-maps.yandex.ru/2.1/?apikey=&lang=uz_UZ";
    script.async = true;
    script.onload = () => window.ymaps.ready(() => { window.ymapsReady = true; resolve(); });
    document.head.appendChild(script);
  });

// Backend Store ni frontend Store ga moslashtirish
const adaptStore = (s: any): Store => ({
  id: s.id,
  name: s.name,
  logoUrl: s.logoUrl || `https://placehold.co/48x48/FF6B35/fff?text=${s.name.charAt(0)}`,
  distanceKm: s.distanceKm || 0,
  address: s.address,
  rating: s.rating || 5,
  reviewCount: s.reviewCount || 0,
  isVerified: s.isVerified || false,
  workingHours: {
    open: s.workingHoursOpen || "09:00",
    close: s.workingHoursClose || "18:00",
    isOpenNow: (() => {
      const now = new Date();
      const [oh, om] = (s.workingHoursOpen || "09:00").split(":").map(Number);
      const [ch, cm] = (s.workingHoursClose || "18:00").split(":").map(Number);
      const cur = now.getHours() * 60 + now.getMinutes();
      return cur >= oh * 60 + om && cur <= ch * 60 + cm;
    })(),
  },
  coordinates: { lat: s.lat || 41.31, lng: s.lng || 69.28 },
});

interface MapPageProps {
  onBack: () => void;
}

const MapPage: React.FC<MapPageProps> = ({ onBack }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const data = await storesApi.getAll();
        setStores(data.map(adaptStore));
      } catch {
        // fallback to mock if backend not running
        try {
          const { mockProducts } = await import("../data/mockProducts");
          const unique = Array.from(new Map((mockProducts as any[]).map((p: any) => [p.store.id, p.store])).values()) as Store[];
          setStores(unique);
        } catch {}
      }
    };
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length === 0) return;
    let destroyed = false;

    const init = async () => {
      await loadYmaps();
      if (destroyed || !mapRef.current) return;

      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.destroy(); } catch {}
        mapInstanceRef.current = null;
      }

      const map = new window.ymaps.Map(mapRef.current, {
        center: [41.3111, 69.2797], zoom: 12,
        controls: ["zoomControl", "geolocationControl"],
      });

      stores.forEach((store) => {
        if (!store.coordinates?.lat) return;
        const placemark = new window.ymaps.Placemark(
          [store.coordinates.lat, store.coordinates.lng],
          {
            balloonContentHeader: `<b>${store.name}</b>`,
            balloonContentBody: `<p style="color:#666;font-size:12px">${store.address}</p><p style="color:#f97316;font-size:12px">⭐ ${store.rating} · ${store.distanceKm} km</p>`,
            hintContent: store.name,
          },
          { preset: store.workingHours.isOpenNow ? "islands#orangeShopIcon" : "islands#grayShopIcon" }
        );
        placemark.events.add("click", () => setSelectedStore(store));
        map.geoObjects.add(placemark);
      });

      mapInstanceRef.current = map;
      setLoading(false);
    };

    init();
    return () => {
      destroyed = true;
      if (mapInstanceRef.current) { try { mapInstanceRef.current.destroy(); } catch {} mapInstanceRef.current = null; }
    };
  }, [stores]);

  const flyToStore = (store: Store) => {
    setSelectedStore(store);
    if (mapInstanceRef.current && store.coordinates?.lat) {
      mapInstanceRef.current.setCenter([store.coordinates.lat, store.coordinates.lng], 16, { duration: 600 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Do'konlar xaritasi</h1>
            <p className="text-xs text-gray-400">{stores.length} ta do'kon · Toshkent</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-0">
        {/* Sidebar */}
        <div className="lg:w-80 bg-white border-r border-gray-100 overflow-y-auto order-2 lg:order-1">
          <div className="p-3 space-y-2">
            {stores.map((store) => (
              <button key={store.id} onClick={() => flyToStore(store)}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all duration-200 ${selectedStore?.id === store.id ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                <div className="flex items-start gap-3">
                  <img src={store.logoUrl} alt={store.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-sm font-semibold text-gray-800 truncate">{store.name}</span>
                      {store.isVerified && <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1.5">{store.address}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-lg ${store.workingHours.isOpenNow ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {store.workingHours.isOpenNow ? "Ochiq" : "Yopiq"}
                      </span>
                      <span className="text-xs text-gray-400">⭐ {store.rating}</span>
                      <span className="text-xs text-gray-400">{store.distanceKm} km</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative order-1 lg:order-2" style={{ minHeight: "400px" }}>
          <div ref={mapRef} className="absolute inset-0" />
          {loading && (
            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-3">
              <svg className="w-8 h-8 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <p className="text-sm text-gray-400">Xarita yuklanmoqda...</p>
            </div>
          )}
          {selectedStore && !loading && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-10">
              <div className="flex items-center gap-3 mb-2">
                <img src={selectedStore.logoUrl} alt={selectedStore.name} className="w-10 h-10 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{selectedStore.name}</p>
                  <p className="text-xs text-gray-400 truncate">{selectedStore.address}</p>
                </div>
                <button onClick={() => setSelectedStore(null)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${selectedStore.workingHours.isOpenNow ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                  {selectedStore.workingHours.isOpenNow ? "Ochiq" : "Yopiq"}
                </span>
                <span className="text-xs text-gray-400">{selectedStore.workingHours.open}–{selectedStore.workingHours.close}</span>
                <span className="text-xs text-gray-400 ml-auto">⭐ {selectedStore.rating}</span>
              </div>
              <a href={`https://yandex.uz/maps/?ll=${selectedStore.coordinates.lng},${selectedStore.coordinates.lat}&z=16&pt=${selectedStore.coordinates.lng},${selectedStore.coordinates.lat},pm2rdm`}
                target="_blank" rel="noopener noreferrer"
                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                Yo'l olish
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
