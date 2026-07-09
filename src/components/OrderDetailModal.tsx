import React, { useEffect, useRef } from "react";

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

interface OrderDetailStore {
  name: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  rating?: number;
  isVerified?: boolean;
  workingHoursOpen?: string;
  workingHoursClose?: string;
  lat?: number;
  lng?: number;
}

interface OrderDetailItem {
  id: string;
  quantity: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  note?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    nameUz?: string;
    description?: string;
    brand?: string;
    imageUrl?: string;
    unit: string;
    pricePerUnit: number;
    store?: OrderDetailStore;
  };
}

interface OrderDetailModalProps {
  order: OrderDetailItem;
  onClose: () => void;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

const MONTHS_UZ = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

const formatFullDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()}-${MONTHS_UZ[d.getMonth()]}, ${d.getFullYear()} · ${hh}:${mm}`;
};

const STATUS_CONFIG: Record<OrderDetailItem["status"], { label: string; className: string }> = {
  pending: { label: "Kutilmoqda", className: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200" },
  confirmed: { label: "Tasdiqlandi", className: "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200" },
  delivered: { label: "Yetkazildi", className: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200" },
  cancelled: { label: "Bekor qilindi", className: "bg-red-50 text-red-500 ring-1 ring-inset ring-red-200" },
};

const STEPS: { key: OrderDetailItem["status"]; label: string }[] = [
  { key: "pending", label: "Qabul qilindi" },
  { key: "confirmed", label: "Tasdiqlandi" },
  { key: "delivered", label: "Yetkazildi" },
];

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const store = order.product?.store;
  const status = STATUS_CONFIG[order.status];
  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!store?.lat || !store?.lng || !mapRef.current) return;
    let destroyed = false;

    const init = async () => {
      await loadYmaps();
      if (destroyed || !mapRef.current) return;

      const map = new window.ymaps.Map(mapRef.current, {
        center: [store.lat, store.lng], zoom: 15,
        controls: [],
      });
      map.behaviors.disable(["scrollZoom"]);

      const placemark = new window.ymaps.Placemark(
        [store.lat, store.lng],
        { hintContent: store.name },
        { preset: "islands#orangeShopIcon" }
      );
      map.geoObjects.add(placemark);
      mapInstanceRef.current = map;
    };

    init();
    return () => {
      destroyed = true;
      if (mapInstanceRef.current) { try { mapInstanceRef.current.destroy(); } catch {} mapInstanceRef.current = null; }
    };
  }, [store?.lat, store?.lng, store?.name]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex sm:items-center sm:justify-center">
        <div className="w-full sm:max-w-lg sm:mx-4 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900">Buyurtma tafsilotlari</h2>
              <p className="text-xs text-gray-400 mt-0.5">{formatFullDate(order.createdAt)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Status + progress */}
            <div>
              <span className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${status.className}`}>
                {status.label}
              </span>

              {!isCancelled ? (
                <div className="flex items-center">
                  {STEPS.map((step, i) => (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${i <= stepIndex ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-300"}`}>
                          {i < stepIndex || (i === stepIndex) ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-[10px] font-bold">{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium text-center w-16 ${i <= stepIndex ? "text-gray-700" : "text-gray-300"}`}>{step.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-4 ${i < stepIndex ? "bg-orange-500" : "bg-gray-100"}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Bu buyurtma bekor qilingan.</p>
              )}
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">Mahsulot</p>
              <div className="bg-gray-50 rounded-2xl p-4 flex gap-3">
                <div className="w-20 h-20 bg-white rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                  {order.product?.imageUrl ? (
                    <img src={order.product.imageUrl} alt={order.product.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800 mb-0.5">{order.product?.nameUz || order.product?.name}</h4>
                  {order.product?.brand && <p className="text-xs text-gray-400 mb-1.5">{order.product.brand}</p>}
                  {order.product?.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{order.product.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{order.quantity} {order.product?.unit} × {formatPrice(order.product?.pricePerUnit || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-sm text-gray-500">Jami summa</span>
                <span className="text-lg font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
              </div>

              {order.note && (
                <div className="mt-3 p-3 bg-orange-50 rounded-xl text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Izoh:</span> {order.note}
                </div>
              )}
            </div>

            {/* Lokatsiya / Do'kon */}
            {store && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">Do'kon va lokatsiya</p>
                <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <div className="flex items-center gap-3 p-4">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500 font-bold">
                        {store.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{store.name}</p>
                        {store.isVerified && (
                          <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {store.address && <p className="text-xs text-gray-400 truncate mt-0.5">{store.address}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {typeof store.rating === "number" && <span className="text-xs text-gray-400">⭐ {store.rating}</span>}
                        {store.workingHoursOpen && (
                          <span className="text-xs text-gray-400">{store.workingHoursOpen}–{store.workingHoursClose}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {store.lat && store.lng && (
                    <div ref={mapRef} className="w-full h-40 bg-gray-100" />
                  )}

                  <div className="flex gap-2 p-3 pt-2">
                    {store.phone && (
                      <a href={`tel:${store.phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2.5 rounded-xl transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Qo'ng'iroq
                      </a>
                    )}
                    {store.lat && store.lng && (
                      <a href={`https://yandex.uz/maps/?ll=${store.lng},${store.lat}&z=16&pt=${store.lng},${store.lat},pm2rdm`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Yo'l olish
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailModal;
