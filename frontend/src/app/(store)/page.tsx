import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import {
  getCategories,
  getFeaturedProducts,
  getLatestProducts,
} from "@/lib/server-api";
import type { Category } from "@/lib/types";

export const metadata = {
  title: "ALFPAT ELECTRONICS — Quality Home Electronics in Nigeria",
  description:
    "Shop the best TVs, Washing Machines, Refrigerators, Fans, Speakers and more. Fast delivery across Nigeria.",
};

export default async function HomePage() {
  const [categories, featuredProducts, latestProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getLatestProducts(),
  ]);

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative bg-white overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0B1B3A" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <div>
              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#F97316] text-xs font-medium px-4 py-1.5 rounded-full mb-6">
                🇳🇬 Nigeria&apos;s Trusted Electronics Store
              </span>

              <h1
                className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0B1B3A] leading-tight mb-5"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Quality Electronics
                <br />
                for Every Home
              </h1>

              <p className="text-gray-500 text-lg leading-relaxed max-w-lg mb-8">
                From TVs to Washing Machines — we bring the best brands to your
                doorstep across Nigeria.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Link
                  href="/products"
                  className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm"
                >
                  Shop Now
                </Link>
                <a
                  href="#categories"
                  className="border-2 border-[#0B1B3A] text-[#0B1B3A] hover:bg-[#0B1B3A] hover:text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm"
                >
                  View Categories
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Genuine Products
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Fast Delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Easy Returns
                </span>
              </div>
            </div>

            {/* Right — category preview grid */}
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 4).map((cat: Category) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className="group bg-[#F8F9FA] rounded-2xl p-5 flex flex-col items-center justify-center aspect-square hover:shadow-md hover:bg-white transition-all duration-300"
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover mb-3 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gray-200 flex items-center justify-center mb-3">
                      <span className="text-2xl font-bold text-gray-400">
                        {cat.name?.[0]}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-[#0B1B3A] text-center">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section id="categories" className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <h2
              className="text-2xl lg:text-3xl font-bold text-[#0B1B3A] mb-3"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Shop by Category
            </h2>
            <div className="w-12 h-1 bg-[#F97316] rounded-full mx-auto" />
          </div>

          <div className="flex lg:grid lg:grid-cols-6 gap-4 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {categories.map((cat: Category) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group flex-shrink-0 w-36 lg:w-auto bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 flex flex-col items-center hover:shadow-md hover:ring-[#F97316]/30 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="w-full aspect-square bg-gray-50 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-gray-300">
                      {cat.name?.[0]}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-[#0B1B3A] text-center">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      {featuredProducts.length > 0 && (
        <section className="bg-[#FAFAFA] py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2
                className="text-2xl lg:text-3xl font-bold text-[#0B1B3A]"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Featured Products
              </h2>
              <Link
                href="/products"
                className="text-sm font-semibold text-[#F97316] hover:text-[#EA6A0A] transition-colors flex items-center gap-1"
              >
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <ProductGrid products={featuredProducts} loading={false} />
          </div>
        </section>
      )}

      {/* ─── PROMO BANNER ─── */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="">
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2 max-md:text-center">
              Free Delivery
            </h3>
            <p className="text-white/90 text-sm lg:text-base">
              On all orders above ₦50,000 within Enugu
            </p>
          </div>
          <Link
            href="/products"
            className="border-2 border-white text-white hover:bg-white hover:text-[#F97316] font-semibold px-8 py-3 rounded-full transition-colors text-sm shrink-0"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* ─── LATEST ARRIVALS ─── */}
      {latestProducts.length > 0 && (
        <section className="bg-white py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2
                className="text-2xl lg:text-3xl font-bold text-[#0B1B3A]"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Latest Arrivals
              </h2>
              <Link
                href="/products"
                className="text-sm font-semibold text-[#F97316] hover:text-[#EA6A0A] transition-colors flex items-center gap-1"
              >
                View All
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <ProductGrid products={latestProducts} loading={false} />
          </div>
        </section>
      )}
    </>
  );
}
