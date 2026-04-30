export interface Store {
  id: string;
  name: string;
  logoUrl: string;
  distanceKm: number;
  address: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  workingHours: {
    open: string;
    close: string;
    isOpenNow: boolean;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export type ProductCategory =
  | "cement"
  | "rebar"
  | "brick"
  | "insulation"
  | "paint"
  | "flooring"
  | "plumbing"
  | "electrical"
  | "roofing"
  | "tools";

export interface Product {
  id: string;
  name: string;
  nameUz: string;
  slug: string;
  description: string;
  category: ProductCategory;
  brand: string;
  unit: string;
  pricePerUnit: number;
  oldPricePerUnit?: number;
  currency: "UZS" | "USD";
  images: ProductImage[];
  store: Store;
  inStock: boolean;
  stockQuantity: number;
  minOrderQuantity: number;
  specifications: Record<string, string>;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  discount?: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FilterOptions {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  maxDistanceKm?: number;
  inStockOnly?: boolean;
  minRating?: number;
  brands?: string[];
}

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "distance"
  | "rating"
  | "newest";

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
