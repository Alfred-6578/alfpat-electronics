"use client";

import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/formatCurrency";
import type { Product } from "@/lib/types";

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart, items: cartItems } = useCart();

  const isInCart = (id: string) => cartItems.some((c) => c._id === id);

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      _id: item._id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      discountPrice: item.discountPrice,
      images: [item.image],
      stock: item.stock,
    } as Product, 1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold text-[#0B1B3A]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            My Wishlist
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {wishlistCount} {wishlistCount === 1 ? "item" : "items"} saved
          </p>
        </div>
        {wishlistCount > 0 && (
          <button
            onClick={clearWishlist}
            className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-20 h-20 text-gray-200 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-xl font-bold text-[#0B1B3A] mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-400 mb-6">
            Save items you love by tapping the heart icon
          </p>
          <Link
            href="/products"
            className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-8 py-3 rounded-full transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
            >
              {/* Image */}
              <Link href={`/products/${item.slug}`} className="shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover bg-gray-50"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-300">{item.name[0]}</span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="hover:text-[#F97316] transition-colors">
                  <h3 className="text-sm font-semibold text-[#0B1B3A] line-clamp-2">{item.name}</h3>
                </Link>

                <div className="flex items-baseline gap-2 mt-1.5">
                  {item.discountPrice ? (
                    <>
                      <span className="text-lg font-bold text-[#F97316]">{formatNaira(item.discountPrice)}</span>
                      <span className="text-sm text-gray-400 line-through">{formatNaira(item.price)}</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-[#0B1B3A]">{formatNaira(item.price)}</span>
                  )}
                </div>

                <p className={`text-xs mt-1 ${item.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                  {item.stock > 0 ? "In Stock" : "Out of Stock"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {item.stock > 0 && (
                  isInCart(item._id) ? (
                    <Link
                      href="/products"
                      className="px-4 py-2 text-xs font-semibold text-green-600 bg-green-50 rounded-full text-center flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      In Cart
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-4 py-2 text-xs font-semibold bg-[#F97316] hover:bg-[#EA6A0A] text-white rounded-full transition-colors"
                    >
                      Add to Cart
                    </button>
                  )
                )}
                <button
                  onClick={() => removeFromWishlist(item._id)}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 rounded-full transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-6">
            <Link
              href="/products"
              className="text-sm font-medium text-[#F97316] hover:text-[#EA6A0A] transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
