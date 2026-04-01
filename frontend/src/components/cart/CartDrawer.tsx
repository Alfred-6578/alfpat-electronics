"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatCurrency";

export default function CartDrawer({ isOpen, onClose }) {
  const { items, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    if (user) {
      router.push("/checkout");
    } else {
      router.push("/login?redirect=/checkout");
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-[#0B1B3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="text-lg font-bold text-[#0B1B3A]">My Cart</h2>
            </div>
            <div className="flex items-center gap-3">
              {cartCount > 0 && (
                <span className="text-sm text-gray-400">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              )}
              <button
                onClick={onClose}
                className="p-1 text-[#0B1B3A] hover:text-[#F97316] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <svg className="w-24 h-24 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-lg font-bold text-[#0B1B3A] mb-1">
                  Your cart is empty
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Looks like you haven&apos;t added anything yet
                </p>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="inline-block bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-8 py-2.5 rounded-full transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              /* Items list */
              <div className="px-6 py-4">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-4 py-4 border-b border-gray-50 last:border-b-0"
                  >
                    {/* Image */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-50 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-gray-300">
                          {item.name?.[0]}
                        </span>
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0B1B3A] line-clamp-2 leading-snug">
                        {item.name}
                      </p>

                      {/* Price */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-[#F97316]">
                          {formatNaira(item.discountPrice || item.price)}
                        </span>
                        {item.discountPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatNaira(item.price)}
                          </span>
                        )}
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.qty - 1)}
                            className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-[#0B1B3A] hover:border-[#0B1B3A] transition-colors text-sm"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-[#0B1B3A] w-6 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.qty + 1)}
                            disabled={item.qty >= item.stock}
                            className={`w-7 h-7 border rounded flex items-center justify-center text-sm transition-colors ${
                              item.qty >= item.stock
                                ? "border-gray-100 text-gray-300 cursor-not-allowed"
                                : "border-gray-200 text-[#0B1B3A] hover:border-[#0B1B3A]"
                            }`}
                          >
                            +
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                </span>
                <span className="text-xl font-bold text-[#0B1B3A]">
                  {formatNaira(cartTotal)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold py-3.5 rounded-full transition-colors text-sm"
              >
                Proceed to Checkout
              </button>

              {!user && (
                <p className="text-xs text-gray-400 text-center">
                  You&apos;ll be asked to log in before checkout
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
