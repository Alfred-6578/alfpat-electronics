"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/formatCurrency";
import type { Product, Category, CartItem } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addToCart, updateQuantity } = useCart();
  const [added, setAdded] = useState(false);
  const cartItem: CartItem | undefined = items.find((i) => i._id === product._id);
  const { name, slug, price, discountPrice, images, category, stock } = product;
  const image = images?.[0];
  const outOfStock = stock === 0;

  const discount = discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const categoryName =
    typeof category === "object" && category !== null
      ? (category as Category).name
      : (category as string);

  return (
    <div className="group relative flex flex-col rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500">
      {/* Stretched link — covers the entire card */}
      <Link
        href={`/products/${slug}`}
        className="absolute inset-0 z-10"
        aria-label={name}
      />

      {/* ── Image area ── pointer-events-none so clicks go to the link */}
      <div className="relative p-2.5 tny:p-3 pb-2 pointer-events-none">
        {discount > 0 && !outOfStock && (
          <span className="absolute top-5 left-5 bg-[#F97316] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            -{discount}%
          </span>
        )}

        {/* Wishlist — pointer-events-auto + z-20 to intercept above the link */}
        <button
          onClick={() => {}}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#0B1B3A] flex items-center justify-center text-white hover:bg-[#F97316] transition-colors z-20 pointer-events-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <div className="flex h-45 vsm:h-60 items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <span className="text-6xl font-bold text-gray-300">{name?.[0]}</span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-sm font-bold text-gray-500 bg-white/80 px-5 py-2 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* ── Info area ── pointer-events-none so clicks go to the link */}
      <div className="flex flex-col flex-1 p-2.5 tny:p-4 py-3.5 pt-1 pointer-events-none justify-between">
        <div className="">
          <h3 className="text font-semibold text-primary leading-snug truncate">
            {name}
          </h3>
          {category && (
            <span className="text-[11px] text-gray-400 mt-0.5">
              {categoryName}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between mt-1.5">
          <div>
            {discountPrice ? (
              <>
                <p className="text-[11px] text-gray-500 line-through leading-none mb-0.5">
                  {formatNaira(price)}
                </p>
                <p className="vsm:text-lg font-bold text-primary leading-none">
                  {formatNaira(discountPrice)}
                </p>
              </>
            ) : (
              <p className=" vsm:text-lg font-bold text-primary leading-none">
                {formatNaira(price)}
              </p>
            )}
          </div>

        </div>

        {/* Full-width cart button */}
        {!outOfStock && (
          <div className="z-20 pointer-events-auto mt-3">
            {cartItem ? (
              <div className="flex items-center w-full border border-gray-200 rounded-full">
                <button
                  onClick={() => updateQuantity(product._id, cartItem.qty - 1)}
                  className="flex-1 h-9 flex items-center justify-center text-[#0B1B3A] hover:bg-gray-50 rounded-l-full transition-colors text-sm font-bold"
                >
                  −
                </button>
                <span className="flex-1 text-center text-sm font-bold text-primary">
                  {cartItem.qty}
                </span>
                <button
                  onClick={() => updateQuantity(product._id, cartItem.qty + 1)}
                  disabled={cartItem.qty >= stock}
                  className={`flex-1 h-9 flex items-center justify-center rounded-r-full transition-colors text-sm font-bold ${
                    cartItem.qty >= stock
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#0B1B3A] hover:bg-gray-50"
                  }`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  addToCart(product, 1);
                  setAdded(true);
                  setTimeout(() => setAdded(false), 1500);
                }}
                className={`w-full py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  added
                    ? "bg-green-500 text-white"
                    : "bg-[#F97316] hover:bg-[#EA6A0A] text-white"
                }`}
              >
                {added ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Added
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {outOfStock && (
          <div className="mt-3">
            <span className="block w-full py-2 rounded-full text-sm font-medium text-center text-gray-400 bg-gray-100">
              Out of Stock
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
