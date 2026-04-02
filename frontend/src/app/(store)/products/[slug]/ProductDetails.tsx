"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/formatCurrency";
import ProductGrid from "@/components/products/ProductGrid";
import type { Product } from "@/lib/types";

interface ProductDetailsProps {
  product: Product;
  categoryName: string;
  categorySlug: string;
  relatedProducts: Product[];
}

export default function ProductDetails({
  product,
  categoryName,
  categorySlug,
  relatedProducts,
}: ProductDetailsProps) {
  const { items, addToCart, updateQuantity } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [specsOpen, setSpecsOpen] = useState(false);

  const cartItem = items.find((i) => i._id === product._id);
  const outOfStock = product.stock === 0;
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, qty);
    setQty(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-[#F97316] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#F97316] transition-colors">
          Products
        </Link>
        {categoryName && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${categorySlug}`}
              className="hover:text-[#F97316] transition-colors"
            >
              {categoryName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#0B1B3A] font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* ── Left: Images ── */}
        <div>
          <div className="bg-[#F3F4F6] rounded-2xl overflow-hidden mb-4">
            <div className="aspect-square flex items-center justify-center p-8">
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-8xl font-bold text-gray-300">
                  {product.name[0]}
                </span>
              )}
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    selectedImage === i
                      ? "border-[#F97316]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-full object-contain bg-[#F3F4F6] p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Info ── */}
        <div>
          {categoryName && (
            <Link
              href={`/products?category=${categorySlug}`}
              className="text-xs font-semibold uppercase tracking-wider text-[#F97316] hover:text-[#EA6A0A] transition-colors"
            >
              {categoryName}
            </Link>
          )}

          <h1
            className="text-2xl lg:text-3xl font-bold text-[#0B1B3A] mt-2 mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 mb-6">
            {product.discountPrice ? (
              <>
                <span className="text-3xl font-bold text-[#0B1B3A]">
                  {formatNaira(product.discountPrice)}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  {formatNaira(product.price)}
                </span>
                <span className="bg-[#F97316] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  -{discount}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-[#0B1B3A]">
                {formatNaira(product.price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6">
            {outOfStock ? (
              <span className="text-sm font-medium text-red-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Out of Stock
              </span>
            ) : (
              <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                In Stock ({product.stock} available)
              </span>
            )}
          </div>

          <p className="text-gray-500 leading-relaxed mb-6">
            {product.description}
          </p>

          {product.brand && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-400">Brand:</span>
              <span className="text-sm font-semibold text-[#0B1B3A]">
                {product.brand}
              </span>
            </div>
          )}

          {/* Add to cart */}
          {!outOfStock && (
            <div className="flex items-center gap-4 mb-8">
              {!cartItem && (
                <div className="flex items-center border border-gray-200 rounded-full">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#0B1B3A] hover:bg-gray-50 rounded-l-full transition-colors font-bold"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-[#0B1B3A]">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#0B1B3A] hover:bg-gray-50 rounded-r-full transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
              )}

              {cartItem ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-full">
                    <button
                      onClick={() => updateQuantity(product._id, cartItem.qty - 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#0B1B3A] hover:bg-gray-50 rounded-l-full transition-colors font-bold"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-[#0B1B3A]">
                      {cartItem.qty}
                    </span>
                    <button
                      onClick={() => updateQuantity(product._id, cartItem.qty + 1)}
                      disabled={cartItem.qty >= product.stock}
                      className={`w-10 h-10 flex items-center justify-center rounded-r-full transition-colors font-bold ${
                        cartItem.qty >= product.stock
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-[#0B1B3A] hover:bg-gray-50"
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    In Cart
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold py-3 px-8 rounded-full transition-colors text-sm"
                >
                  Add to Cart
                </button>
              )}
            </div>
          )}

          {/* Collapsible Specs */}
          {product.specs && product.specs.length > 0 && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setSpecsOpen(!specsOpen)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <h3 className="text-sm font-bold text-[#0B1B3A] uppercase tracking-wider">
                  Specifications
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                    specsOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  specsOpen ? "max-h-96 pb-4" : "max-h-0"
                }`}
              >
                <div className="space-y-0">
                  {product.specs.map((spec, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
                        i % 2 === 0 ? "bg-gray-50" : ""
                      }`}
                    >
                      <span className="text-sm text-gray-400">{spec.key}</span>
                      <span className="text-sm font-medium text-[#0B1B3A]">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <svg className="w-6 h-6 mx-auto text-[#F97316] mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs text-gray-400">Genuine Product</p>
            </div>
            <div className="text-center">
              <svg className="w-6 h-6 mx-auto text-[#F97316] mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs text-gray-400">Fast Delivery</p>
            </div>
            <div className="text-center">
              <svg className="w-6 h-6 mx-auto text-[#F97316] mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-xs text-gray-400">Easy Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-100">
          <h2
            className="text-2xl font-bold text-[#0B1B3A] mb-8"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            You may also like
          </h2>
          <ProductGrid products={relatedProducts} loading={false} columns={4} />
        </section>
      )}
    </div>
  );
}
