import React, { useEffect, useState } from "react";
import { ordersApi } from "../api/api";
import OrderDetailModal from "../components/OrderDetailModal";

interface OrderItem {
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
    store?: {
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
    };
  };
}

interface OrdersPageProps {
  onBack: () => void;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

const MONTHS_UZ = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatDateGroup = (dateStr: string): string => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return "Bugun";
  if (isSameDay(d, yesterday)) return "Kecha";
  return `${d.getDate()}-${MONTHS_UZ[d.getMonth()]}, ${d.getFullYear()}`;
};

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const STATUS_CONFIG: Record<OrderItem["status"], { label: string; className: string; dot: string; icon: React.ReactNode }> = {
  pending: {
    label: "Kutilmoqda",
    className: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200",
    dot: "bg-amber-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  confirmed: {
    label: "Tasdiqlandi",
    className: "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200",
    dot: "bg-blue-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  delivered: {
    label: "Yetkazildi",
    className: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200",
    dot: "bg-emerald-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  cancelled: {
    label: "Bekor qilindi",
    className: "bg-red-50 text-red-500 ring-1 ring-inset ring-red-200",
    dot: "bg-red-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

const FILTERS: { value: OrderItem["status"] | "all"; label: string }[] = [
  { value: "all", label: "Barchasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "confirmed", label: "Tasdiqlandi" },
  { value: "delivered", label: "Yetkazildi" },
  { value: "cancelled", label: "Bekor qilindi" },
];

const OrdersPage: React.FC<OrdersPageProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<OrderItem["status"] | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await ordersApi.getMyOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e.message || "Buyurtmalarni yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.totalPrice), 0);

  const countFor = (status: OrderItem["status"] | "all") =>
    status === "all" ? orders.length : orders.filter((o) => o.status === status).length;

  // Sanalar bo'yicha guruhlash (Bugun / Kecha / sana)
  const groups: { label: string; items: OrderItem[] }[] = [];
  for (const order of filteredOrders) {
    const label = formatDateGroup(order.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) lastGroup.items.push(order);
    else groups.push({ label, items: [order] });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Buyurtmalarim</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 pb-6">
        {/* Statistika banneri */}
        {!loading && !error && orders.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 mb-5 text-white flex items-center overflow-hidden relative">
            <div className="flex-1 relative z-10">
              <p className="text-orange-100 text-xs font-medium mb-0.5">Jami buyurtmalar</p>
              <p className="text-2xl font-bold">{orders.length} ta</p>
            </div>
            <div className="w-px h-9 bg-white/25 mx-4 relative z-10" />
            <div className="flex-1 relative z-10">
              <p className="text-orange-100 text-xs font-medium mb-0.5">Jami xarid</p>
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
            </div>
            <div className="absolute right-2 -bottom-3 opacity-10 text-[90px] leading-none select-none">📦</div>
          </div>
        )}

        {/* Filter tabs */}
        {!loading && !error && orders.length > 0 && (
          <div className="overflow-x-auto scrollbar-none mb-5 -mx-4 px-4">
            <div className="flex items-center gap-2 w-max">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === f.value
                      ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      filter === f.value ? "bg-white/25" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {countFor(f.value)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg className="w-8 h-8 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {orders.length === 0 ? "Hali buyurtmalar yo'q" : "Bu holatda buyurtma yo'q"}
            </h3>
            <p className="text-sm text-gray-400">Mahsulot xarid qilsangiz, shu yerda ko'rinadi</p>
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5 px-0.5">
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.items.map((order) => {
                    const status = STATUS_CONFIG[order.status];
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        role="button"
                        tabIndex={0}
                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 p-4 relative overflow-hidden cursor-pointer active:scale-[0.99]"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.dot}`} />

                        <div className="flex items-center justify-between mb-3 pl-2">
                          <p className="text-xs text-gray-400 font-medium">{formatTime(order.createdAt)}</p>
                          <span className={`text-xs font-semibold pl-2 pr-2.5 py-1 rounded-full flex items-center gap-1.5 ${status.className}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>

                        <div className="flex gap-3 pl-2">
                          <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                            {order.product?.imageUrl ? (
                              <img src={order.product.imageUrl} alt={order.product.name} className="w-full h-full object-contain p-1.5" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 mb-0.5">
                              {order.product?.nameUz || order.product?.name || "Mahsulot"}
                            </h4>
                            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                              </svg>
                              {order.product?.store?.name}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {order.quantity} {order.product?.unit} <span className="text-gray-300 mx-0.5">·</span> {formatPrice(order.product?.pricePerUnit || 0)}
                              </span>
                              <span className="text-sm font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                        {order.note && (
                          <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500 pl-2">
                            <span className="font-medium text-gray-600">Izoh:</span> {order.note}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-2 pl-2 text-orange-500 text-xs font-semibold">
                          Batafsil
                          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default OrdersPage;
