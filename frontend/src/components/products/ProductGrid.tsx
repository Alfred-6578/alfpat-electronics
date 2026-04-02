"use client";

import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  emptyMessage?: string;
  onClearFilters?: () => void;
  columns?: 3 | 4;
}

const gridCols = {
  3: "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6",
  4: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6",
};

export default function ProductGrid({
  products,
  loading,
  emptyMessage = "No products found",
  onClearFilters,
  columns = 4,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={gridCols[columns]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          className="w-20 h-20 text-gray-200 mb-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={0.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-lg font-bold text-[#0B1B3A] mb-1">{emptyMessage}</p>
        <p className="text-sm text-gray-400 mb-5">
          Try adjusting your search or filters
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="bg-[#F97316] hover:bg-[#EA6A0A] text-white text-sm font-semibold px-8 py-2.5 rounded-full transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={gridCols[columns]}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
