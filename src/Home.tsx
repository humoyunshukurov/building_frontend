import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import ProductGrid from "./components/ProductGrid";
import ProductModal from "./components/ProductModal";
import MapPage from "./pages/MapPage";
import { Product, ProductCategory, SortOption } from "./types";
import { useCart } from "./context/CartContext";
import { productsApi } from "./api/api";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Mos ravishda" },
  { value: "price_asc", label: "Narx: arzondan qimmatga" },
  { value: "price_desc", label: "Narx: qimmatdan arzonga" },
  { value: "distance", label: "Yaqin do'konlar" },
  { value: "rating", label: "Eng yuqori reyting" },
  { value: "newest", label: "Yangi kelganlar" },
];

interface HomeProps {
  user: { name: string; phone: string };
  onLogout: () => void;
}

const Home: React.FC<HomeProps> = ({ user, onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showMap, setShowMap] = useState(false);

  const { addToCart, totalCount: cartCount, openCart } = useCart();

  // Backend dan mahsulotlarni yuklash
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchQuery) params.search = searchQuery;
      if (activeCategory) params.category = activeCategory;
      if (sortOption !== "relevance") params.sort = sortOption;

      const res = await productsApi.getAll(params);
      // Backend { data, total } yoki array qaytarishi mumkin
      const data = Array.isArray(res) ? res : (res.data || []);
      setProducts(data);
      setTotalCount(Array.isArray(res) ? data.length : (res.total || data.length));
    } catch {
      // Backend ishlamasa mockdan olamiz
      try {
        const { mockProducts } = await import("./data/mockProducts");
        setProducts(mockProducts as any);
        setFeaturedProducts((mockProducts as any).filter((p: any) => p.isFeatured));
        setTotalCount(mockProducts.length);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, sortOption]);

  // Top mahsulotlarni yuklash
  const loadFeatured = async () => {
    try {
      const data = await productsApi.getFeatured();
      setFeaturedProducts(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => { loadFeatured(); }, []);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
  };

  const handleFavoriteToggle = (productId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  if (showMap) {
    return <MapPage onBack={() => setShowMap(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={selectedProduct ? favorites.has(selectedProduct.id) : false}
        userName={user.name}
      />
      <Navbar
        onSearch={setSearchQuery}
        onCategoryChange={setActiveCategory}
        user={user}
        onLogout={onLogout}
        onMapOpen={() => setShowMap(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        {!searchQuery && !activeCategory && (
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 mb-8 text-white overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-orange-100 text-sm font-medium mb-1">Qurilish materiallari</p>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Eng yaxshi narxda<br />eng yaqin do'kon
              </h1>
              <p className="text-orange-100 text-sm mb-4 max-w-md">
                10,000+ mahsulot · 500+ do'kon · Real vaqtda narxlar
              </p>
              <button className="bg-white text-orange-600 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-orange-50 transition-colors">
                Qidiruvni boshlash
              </button>
            </div>
            <div className="absolute right-4 bottom-0 opacity-10 text-[120px] leading-none select-none">🏗️</div>
          </div>
        )}

        {/* Featured */}
        {!searchQuery && !activeCategory && featuredProducts.length > 0 && (
          <div className="mb-8">
            <ProductGrid
              products={featuredProducts}
              onAddToCart={handleAddToCart}
              onFavoriteToggle={handleFavoriteToggle}
              favorites={favorites}
              title="🔥 Tavsiya etilgan mahsulotlar"
              onOpenModal={setSelectedProduct}
            />
          </div>
        )}

        {/* Sort & Results */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{totalCount}</span> ta mahsulot topildi
          </p>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-orange-400 cursor-pointer">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <ProductGrid
          products={products}
          isLoading={loading}
          onAddToCart={handleAddToCart}
          onFavoriteToggle={handleFavoriteToggle}
          favorites={favorites}
          title={searchQuery || activeCategory ? "Qidiruv natijalari" : "Barcha mahsulotlar"}
          onOpenModal={setSelectedProduct}
        />
      </main>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button onClick={openCart}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-2xl shadow-lg hover:bg-orange-600 transition-all active:scale-95 font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Savat · {cartCount} ta
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
