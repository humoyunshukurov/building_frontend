// REACT_APP_API_URL sozlanmagan bo'lsa (masalan, Vercel'da environment variable
// qo'shilmagan bo'lsa), localhost o'rniga production backend'ga tushamiz — bo'lmasa
// haqiqiy foydalanuvchilar uchun sayt butunlay ishlamay qoladi.
const BASE = process.env.REACT_APP_API_URL || 'https://building-bekend.onrender.com/api';

// Token boshqaruvi
const getToken = () => localStorage.getItem('bf_token');
const setToken = (token: string) => localStorage.setItem('bf_token', token);
const removeToken = () => localStorage.removeItem('bf_token');

// Foydalanuvchi ma'lumotini saqlash
const setStoredUser = (user: any) => localStorage.setItem('bf_user', JSON.stringify(user));
const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('bf_user') || 'null'); } catch { return null; }
};
const removeStoredUser = () => localStorage.removeItem('bf_user');

// Umumiy fetch wrapper
const request = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json();

  if (res.status === 401) {
    // Token eskirgan yoki user bloklangan — avtomatik chiqaramiz
    removeToken();
    removeStoredUser();
    window.dispatchEvent(new CustomEvent('auth:logout', { detail: { blocked: true } }));
    throw new Error('Sessiya tugadi. Iltimos qayta kiring.');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }
  return data;
};

// ─── ADAPTERLAR ──────────────────────────────────────────
// Backend Store → Frontend Store (workingHoursOpen/Close → workingHours ob'ekti, lat/lng → coordinates)
const isStoreOpen = (open: string, close: string): boolean => {
  try {
    const now = new Date();
    const [oh, om] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= oh * 60 + om && cur <= ch * 60 + cm;
  } catch { return true; }
};

const adaptStore = (s: any) => ({
  id: s.id,
  name: s.name,
  logoUrl: s.logoUrl || `https://placehold.co/48x48/f97316/fff?text=${encodeURIComponent((s.name || 'S').charAt(0))}`,
  distanceKm: s.distanceKm || 0,
  address: s.address || '',
  rating: s.rating || 5,
  reviewCount: s.reviewCount || 0,
  isVerified: s.isVerified || false,
  workingHours: {
    open: s.workingHoursOpen || '09:00',
    close: s.workingHoursClose || '18:00',
    isOpenNow: isStoreOpen(s.workingHoursOpen || '09:00', s.workingHoursClose || '18:00'),
  },
  coordinates: {
    lat: s.lat || 41.31,
    lng: s.lng || 69.28,
  },
});

// Mahsulot nomiga qarab rasm tanlash
const NAME_PHOTO_RULES: [RegExp, string][] = [
  [/sement|cement/i,                       '/photos/photo_2026-05-15_09-20-45.jpg'],
  [/armatur/i,                             '/photos/photo_2026-05-15_09-21-08.jpg'],
  [/g['']isht|gisht|brick/i,              '/photos/photo_2026-05-15_09-21-23.jpg'],
  [/mineral|vata|jun|izolyasiya|insul/i,  '/photos/photo_2026-05-15_09-21-36.jpg'],
  [/bo['']yoq|boyoq|paint|tikkurila|dulux/i, '/photos/photo_2026-05-15_09-21-54.jpg'],
  [/laminat|parket|floor/i,               '/photos/photo_2026-05-15_09-22-09.jpg'],
  [/quvur|pipe|pvc|plumb|santekhnika/i,   '/photos/photo_2026-05-15_09-22-23.jpg'],
  [/gips|gypsum/i,                        '/photos/photo_2026-05-15_09-22-39.jpg'],
];

const getProductImageUrl = (p: any): string => {
  if (p.imageUrl && !p.imageUrl.includes('placehold.co')) return p.imageUrl;
  const name = (p.name || '') + ' ' + (p.nameUz || '') + ' ' + (p.category || '');
  for (const [regex, photo] of NAME_PHOTO_RULES) {
    if (regex.test(name)) return photo;
  }
  return '/photos/photo_2026-05-15_09-22-39.jpg';
};

// Backend Product → Frontend Product (imageUrl → images[], maydonlar qo'shish)
const adaptProduct = (p: any) => {
  const imageUrl = getProductImageUrl(p);
  const images = [{ id: p.id + '_img', url: imageUrl, alt: p.name || '', isPrimary: true }];

  return {
    ...p,
    images,
    slug: p.id,
    specifications: {},
    minOrderQuantity: 1,
    currency: p.currency || 'UZS',
    store: p.store ? adaptStore(p.store) : p.store,
  };
};

// ─── AUTH ────────────────────────────────────────────────
export const authApi = {
  // Emailga tasdiqlash kodi yuboradi
  requestCode: (email: string) =>
    request('/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Kodni tekshiradi — kiradi yoki (birinchi marta bo'lsa) ro'yxatdan o'tkazadi
  verifyCode: async (email: string, code: string, name?: string) => {
    const data = await request('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code, name }),
    });
    setToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },

  logout: () => {
    removeToken();
    removeStoredUser();
  },

  getMe: () => request('/auth/me'),

  isLoggedIn: () => !!getToken(),
  getUser: getStoredUser,
};

// ─── MAHSULOTLAR ─────────────────────────────────────────
export const productsApi = {
  getAll: async (params?: Record<string, any>) => {
    const q = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString() : '';
    const res = await request(`/products${q}`);
    if (Array.isArray(res)) return res.map(adaptProduct);
    return { ...res, data: (res.data || []).map(adaptProduct) };
  },

  getFeatured: async () => {
    const res = await request('/products/featured');
    return Array.isArray(res) ? res.map(adaptProduct) : [];
  },

  getOne: async (id: string) => {
    const p = await request(`/products/${id}`);
    return adaptProduct(p);
  },
};

// ─── DO'KONLAR ───────────────────────────────────────────
export const storesApi = {
  getAll: async () => {
    const res = await request('/stores');
    return Array.isArray(res) ? res.map(adaptStore) : [];
  },
  getOne: async (id: string) => {
    const s = await request(`/stores/${id}`);
    return adaptStore(s);
  },
};

// ─── BUYURTMALAR ─────────────────────────────────────────
export const ordersApi = {
  create: (productId: string, quantity: number, note?: string) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, note }),
    }),

  getMyOrders: async () => {
    const data = await request('/orders/my');
    const list = Array.isArray(data) ? data : [];
    return list.map((o: any) => ({
      ...o,
      product: o.product ? { ...o.product, imageUrl: getProductImageUrl(o.product) } : o.product,
    }));
  },
};

// ─── BILDIRISHNOMALAR ────────────────────────────────────
export const notificationsApi = {
  getAll: () => request('/notifications/my'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// ─── IZOHLAR ─────────────────────────────────────────────
export const reviewsApi = {
  getByProduct: (productId: string) => request(`/reviews/product/${productId}`),

  create: (productId: string, rating: number, comment: string) =>
    request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ productId, rating, comment }),
    }),
};
