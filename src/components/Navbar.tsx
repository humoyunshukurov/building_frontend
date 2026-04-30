import { useState, useEffect, useCallback, useRef, FC } from "react";
import { ProductCategory } from "../types";
import { useCart } from "../context/CartContext";
import { notificationsApi } from "../api/api";

interface NavbarProps {
  onSearch?: (query: string) => void;
  onCategoryChange?: (category: ProductCategory | null) => void;
  user?: { name: string; phone: string };
  onLogout?: () => void;
  onMapOpen?: () => void;
}

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "cement", label: "Sement" },
  { value: "rebar", label: "Armatura" },
  { value: "brick", label: "G'isht" },
  { value: "insulation", label: "Izolyasiya" },
  { value: "paint", label: "Bo'yoq" },
  { value: "flooring", label: "Parket" },
  { value: "plumbing", label: "Santexnika" },
  { value: "electrical", label: "Elektr" },
  { value: "roofing", label: "Tom" },
  { value: "tools", label: "Asboblar" },
];

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.floor(hours / 24)} kun oldin`;
};

const notifTypeIcon: Record<string, string> = {
  blocked: "🚫",
  unblocked: "✅",
  order: "📦",
  general: "🔔",
};

const Navbar: FC<NavbarProps> = ({ onSearch, onCategoryChange, user, onLogout, onMapOpen }) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [toasts, setToasts] = useState<any[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const { totalCount, openCart } = useCart();

  const dismissToast = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.getAll();
      const arr: any[] = Array.isArray(data) ? data : [];
      setNotifications(arr);
      const unread = arr.filter((n: any) => !n.isRead && n.type !== 'order').length;
      const unreadMsg = arr.filter((n: any) => !n.isRead && n.type === 'order').length;
      setUnreadCount(unread);
      setUnreadMsgCount(unreadMsg);

      // Yangi kelgan bildirishnomalarni topib toast chiqar
      const newOnes = arr.filter((n: any) => !prevIdsRef.current.has(n.id));
      prevIdsRef.current = new Set(arr.map((n: any) => n.id));
      if (newOnes.length > 0 && prevIdsRef.current.size > newOnes.length) {
        newOnes.forEach((n: any) => {
          const toastId = n.id + '_toast';
          setToasts((prev) => [...prev, { ...n, toastId }]);
          setTimeout(() => dismissToast(toastId), 6000);
        });
      }
    } catch {}
  }, [user]);

  // Bildirishnomalarni yuklash — har 10 soniyada yangilash
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleOpenNotifs = async () => {
    setShowNotifs((v) => !v);
    setShowUserMenu(false);
    if (!showNotifs && unreadCount > 0) {
      try {
        await notificationsApi.markAllRead();
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch {}
    }
  };

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const handleCategory = (cat: ProductCategory | null) => {
    setActiveCategory(cat);
    onCategoryChange?.(cat);
  };

  return (
    <>
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Build<span className="text-orange-500">Finder</span>
          </span>
        </a>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                onSearch?.(val);
              }}
              placeholder="Mahsulot, material yoki do'kon qidiring..."
              className="w-full pl-4 pr-20 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); onSearch?.(""); }}
                className="absolute right-11 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onMapOpen} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="hidden sm:block">Toshkent</span>
          </button>

          {user && (
            <div className="relative">
              <button
                onClick={() => { setShowMessages((v) => !v); setShowNotifs(false); setShowUserMenu(false); }}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:block">Habarlar</span>
                {unreadMsgCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                  </span>
                )}
              </button>

              {showMessages && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMessages(false)} />
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-800">Buyurtma xabarlari</p>
                      {notifications.filter((n) => n.type === 'order' && !n.isRead).length > 0 && (
                        <button
                          onClick={async () => {
                            await notificationsApi.markAllRead();
                            setUnreadMsgCount(0);
                            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                          }}
                          className="text-xs text-orange-500 hover:underline"
                        >
                          Barchasini o'qildi
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.filter((n) => n.type === 'order').length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="text-3xl mb-2">📦</div>
                          <p className="text-sm text-gray-400">Buyurtma xabari yo'q</p>
                        </div>
                      ) : (
                        notifications
                          .filter((n) => n.type === 'order')
                          .map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? "bg-orange-50" : ""}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xl flex-shrink-0 mt-0.5">{notifTypeIcon[n.type] || "📦"}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                                {!n.isRead && <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button onClick={openCart} className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:block">Savat</span>
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{totalCount}</span>
            )}
          </button>

          {/* Bildirishnomalar bell */}
          {user && (
            <div className="relative">
              <button
                onClick={handleOpenNotifs}
                className="relative w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-800">Bildirishnomalar</p>
                      {notifications.length > 0 && (
                        <button
                          onClick={async () => {
                            await notificationsApi.markAllRead();
                            setUnreadCount(0);
                            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                          }}
                          className="text-xs text-orange-500 hover:underline"
                        >
                          Barchasini o'qildi
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="text-3xl mb-2">🔔</div>
                          <p className="text-sm text-gray-400">Bildirishnoma yo'q</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${!n.isRead ? "bg-orange-50" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl flex-shrink-0 mt-0.5">{notifTypeIcon[n.type] || "🔔"}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.isRead && (
                                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User avatar */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu((v) => !v); setShowNotifs(false); }}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[80px] truncate">
                  {user.name.split(" ")[0]}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Chiqish
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="max-w-7xl mx-auto px-4 pb-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 w-max">
          <button
            onClick={() => handleCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === null
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Barchasi
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>

    {/* In-app toast notifications */}
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.toastId}
          className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-100 shadow-2xl rounded-2xl px-4 py-3 w-80 animate-fade-in"
          style={{ animation: "slideInRight 0.3s ease" }}
        >
          <span className="text-2xl flex-shrink-0 mt-0.5">{notifTypeIcon[t.type] || "🔔"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{t.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.message}</p>
          </div>
          <button
            onClick={() => dismissToast(t.toastId)}
            className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
    </>
  );
};

export default Navbar;
