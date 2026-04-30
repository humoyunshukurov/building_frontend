import React from "react";
import { Product } from "../types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onAddToCart?: (product: Product, quantity: number) => void;
  onFavoriteToggle?: (productId: string) => void;
  favorites?: Set<string>;
  title?: string;
  onOpenModal?: (product: Product) => void;
}

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-100" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
      <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
      <div className="h-5 bg-gray-100 rounded-lg w-2/3" />
      <div className="h-4 bg-gray-100 rounded-lg w-full" />
      <div className="h-9 bg-gray-100 rounded-xl" />
    </div>
  </div>
);

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onFavoriteToggle,
  favorites = new Set(),
  title,
  onOpenModal,
}) => {
  if (isLoading) {
    return (
      <div>
        {title && <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Mahsulot topilmadi</h3>
        <p className="text-sm text-gray-400">Boshqa kalit so'z bilan qidirib ko'ring</p>
      </div>
    );
  }

  return (
    <div>
      {title && <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onFavoriteToggle={onFavoriteToggle}
            isFavorite={favorites.has(product.id)}
            onOpenModal={onOpenModal}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
