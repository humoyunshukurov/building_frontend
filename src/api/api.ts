const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

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

// Backend Product → Frontend Product (imageUrl → images[], maydonlar qo'shish)
const adaptProduct = (p: any) => {
  const images = p.imageUrl
    ? [{ id: p.id + '_img', url: p.imageUrl, alt: p.name, isPrimary: true }]
    : [{ id: 'placeholder', url: `https://placehold.co/400x400/f97316/fff?text=${encodeURIComponent((p.name || 'M').charAt(0))}`, alt: p.name || '', isPrimary: true }];

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
  register: async (dto: { name: string; phone: string; email?: string; password: string }) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    setToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },

  login: async (phone: string, password: string) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
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

  getMyOrders: () => request('/orders/my'),
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
