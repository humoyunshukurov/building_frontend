import React from "react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  onFavoriteToggle?: (productId: string) => void;
  isFavorite?: boolean;
  onOpenModal?: (product: Product) => void;
}

const formatPrice = (price: number, currency: "UZS" | "USD"): string => {
  if (currency === "UZS") {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  }
  return "$" + price.toFixed(2);
};

const StarRating: React.FC<{ rating: number; reviewCount: number }> = ({ rating, reviewCount }) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-3 h-3 ${star <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-xs text-gray-400">({reviewCount})</span>
  </div>
);

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onFavoriteToggle,
  isFavorite = false,
  onOpenModal,
}) => {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(product.id);
  };

  const handleCardClick = () => {
    onOpenModal?.(product);
  };

  return (
    <div
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative bg-gray-50 overflow-hidden aspect-square">
        <img
          src={primaryImage?.url}
          alt={primaryImage?.alt ?? product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount && (
            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{product.discount}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Yangi
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Tugagan
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFavorite
              ? "bg-rose-50 text-rose-500"
              : "bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100"
          } hover:scale-110 shadow-sm`}
        >
          <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-1 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="mb-2">
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mb-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base font-bold text-gray-900">
              {formatPrice(product.pricePerUnit, product.currency)}
            </span>
            <span className="text-xs text-gray-400">/ {product.unit}</span>
          </div>
          {product.oldPricePerUnit && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.oldPricePerUnit, product.currency)}
            </span>
          )}
        </div>

        {/* Store */}
        <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-gray-100">
          <img src={product.store.logoUrl} alt={product.store.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate font-medium flex-1">{product.store.name}</span>
          <div className="flex items-center gap-0.5 text-xs text-gray-400 flex-shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {product.store.distanceKm} km
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleCardClick}
          disabled={!product.inStock}
          className={`w-full py-2 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            !product.inStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
          }`}
        >
          {!product.inStock ? "Mavjud emas" : "Ko'rish"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
