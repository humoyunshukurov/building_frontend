import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useReviews } from "../context/ReviewContext";
import ReviewSection from "./ReviewSection";
import YandexMap from "./YandexMap";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onFavoriteToggle?: (productId: string) => void;
  isFavorite?: boolean;
  userName?: string;
}

const formatPrice = (price: number, currency: "UZS" | "USD"): string => {
  if (currency === "UZS") {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
  }
  return "$" + price.toFixed(2);
};

const StarRating: React.FC<{ rating: number; reviewCount: number }> = ({ rating, reviewCount }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <span className="text-sm text-gray-500">{rating} ({reviewCount} sharh)</span>
  </div>
);

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onFavoriteToggle, isFavorite = false, userName = "Foydalanuvchi" }) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [inputVal, setInputVal] = useState("1");
  const { addToCart } = useCart();
  const { getProductRating } = useReviews();

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setInputVal("1");
    setAdded(false);
  }, [product]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (product) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  if (!product) return null;

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

  const changeQty = (delta: number) => {
    const next = Math.max(1, Math.min(product.stockQuantity || 999, quantity + delta));
    setQuantity(next);
    setInputVal(String(next));
  };

  const handleInputChange = (val: string) => {
    setInputVal(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1) {
      setQuantity(Math.min(n, product.stockQuantity || 999));
    }
  };

  const handleInputBlur = () => {
    const n = parseInt(inputVal, 10);
    if (isNaN(n) || n < 1) {
      setQuantity(1);
      setInputVal("1");
    } else {
      const clamped = Math.min(n, product.stockQuantity || 999);
      setQuantity(clamped);
      setInputVal(String(clamped));
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1000);
  };

  const specs = Object.entries(product.specifications);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto animate-in"
          style={{ animation: "modalIn 0.2s ease-out" }}
        >
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.96) translateY(8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>

          {/* Close button */}
          <div className="sticky top-0 z-10 flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-6 -mt-2">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Left — Image */}
              <div className="sm:w-56 flex-shrink-0">
                <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square">
                  <img
                    src={primaryImage?.url}
                    alt={primaryImage?.alt ?? product.name}
                    className="w-full h-full object-contain p-4"
                  />
                  {product.discount && (
                    <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{product.discount}%
                    </div>
                  )}
                  {product.isNew && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Yangi
                    </div>
                  )}
                </div>

                {/* Favorite */}
                <button
                  onClick={() => onFavoriteToggle?.(product.id)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    isFavorite
                      ? "border-rose-200 bg-rose-50 text-rose-500"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorite ? "Sevimlilardan olib tashla" : "Sevimlilarga qo'sh"}
                </button>
              </div>

              {/* Right — Info */}
              <div className="flex-1 min-w-0">
                {/* Brand + Name */}
                <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-1">{product.brand}</p>
                <h2 className="text-lg font-bold text-gray-900 leading-snug mb-3">{product.name}</h2>

                {/* Rating */}
                <div className="mb-4">
                  <StarRating rating={getProductRating(product.id, product.rating, product.reviewCount).rating} reviewCount={getProductRating(product.id, product.rating, product.reviewCount).count} />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {formatPrice(product.pricePerUnit, product.currency)}
                    </span>
                    <span className="text-sm text-gray-400">/ {product.unit}</span>
                  </div>
                  {product.oldPricePerUnit && (
                    <p className="text-sm text-gray-400 line-through mt-0.5">
                      {formatPrice(product.oldPricePerUnit, product.currency)}
                    </p>
                  )}
                  {product.discount && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {formatPrice((product.oldPricePerUnit! - product.pricePerUnit) * quantity, product.currency)} tejaysiz
                    </p>
                  )}
                </div>

                {/* Store */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-2">
                    <img src={product.store.logoUrl} alt={product.store.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-700">{product.store.name}</span>
                        {product.store.isVerified && (
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{product.store.distanceKm} km · {product.store.address}</p>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${product.store.workingHours.isOpenNow ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                      {product.store.workingHours.isOpenNow ? "Ochiq" : "Yopiq"}
                    </div>
                  </div>
                  {/* Mini map */}
                  <YandexMap store={product.store} height="180px" />
                </div>

                {/* Stock */}
                {product.inStock ? (
                  <p className="text-sm text-green-600 font-medium mb-4 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                    </svg>
                    {product.stockQuantity} ta mavjud
                  </p>
                ) : (
                  <p className="text-sm text-red-500 font-medium mb-4 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Mavjud emas
                  </p>
                )}

                {/* Quantity selector */}
                {product.inStock && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Miqdor</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => changeQty(-1)}
                          disabled={quantity <= 1}
                          className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xl font-medium"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={product.stockQuantity}
                          value={inputVal}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onBlur={handleInputBlur}
                          className="w-14 h-11 text-center text-base font-bold text-gray-800 border-x-2 border-gray-200 focus:outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => changeQty(1)}
                          disabled={quantity >= (product.stockQuantity || 999)}
                          className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xl font-medium"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-gray-400">
                        Jami: <span className="font-bold text-gray-700">{formatPrice(product.pricePerUnit * quantity, product.currency)}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                    !product.inStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : added
                      ? "bg-green-500 text-white shadow-lg shadow-green-100"
                      : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-100"
                  }`}
                >
                  {added ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Savatga qo'shildi!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Savatga qo'shish
                    </>
                  )}
                </button>

                {/* Specs */}
                {specs.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Xususiyatlar</p>
                    <div className="space-y-2">
                      {specs.map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{key}</span>
                          <span className="font-medium text-gray-700">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tavsif</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Reviews */}
                <ReviewSection productId={product.id} userName={userName} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
