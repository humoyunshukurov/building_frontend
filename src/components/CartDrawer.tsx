import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { ordersApi } from "../api/api";

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

const CartDrawer: React.FC = () => {
  const { items, isOpen, totalCount, totalPrice, removeFromCart, updateQuantity, clearCart, closeCart } = useCart();
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleCheckout = async () => {
    setOrdering(true);
    try {
      for (const item of items) {
        await ordersApi.create(item.product.id, item.quantity);
      }
      clearCart();
      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        closeCart();
      }, 2000);
    } catch (e: any) {
      alert(e.message || "Buyurtma berishda xatolik yuz berdi");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Savat</h2>
            {totalCount > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalCount} ta
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Tozalash
              </button>
            )}
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Savat bo'sh</h3>
            <p className="text-sm text-gray-400 mb-6">Mahsulot qo'shish uchun katalogni ko'ring</p>
            <button
              onClick={closeCart}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Xarid qilishni boshlash
            </button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => {
                const img = item.product.images?.find((i: any) => i.isPrimary) ?? item.product.images?.[0];
                const step = item.product.minOrderQuantity || 1;
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3 bg-gray-50 rounded-2xl p-3 group"
                  >
                    {/* Image */}
                    <div className="w-16 h-16 bg-white rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                      <img
                        src={img?.url}
                        alt={img?.alt ?? item.product.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-1 mb-0.5">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">{item.product.store?.name}</p>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - step)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg leading-none"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold text-gray-800 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + step)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg leading-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(item.product.pricePerUnit * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Jami ({totalCount} ta mahsulot)
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              {/* Delivery note */}
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Yetkazib berish narxi do'kon bilan kelishiladi
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={ordering || orderSuccess}
                className={`w-full font-semibold py-3.5 rounded-2xl transition-all duration-200 text-sm shadow-lg flex items-center justify-center gap-2 ${
                  orderSuccess
                    ? "bg-green-500 shadow-green-200 text-white"
                    : ordering
                    ? "bg-orange-400 shadow-orange-200 text-white opacity-75 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white shadow-orange-200"
                }`}
              >
                {orderSuccess ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Buyurtma qabul qilindi!
                  </>
                ) : ordering ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Buyurtma berilmoqda...
                  </>
                ) : (
                  "Buyurtma berish"
                )}
              </button>

              <button
                onClick={closeCart}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
              >
                Xarid qilishni davom ettirish
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
