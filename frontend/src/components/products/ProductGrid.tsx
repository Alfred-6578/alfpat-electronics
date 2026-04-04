"use client";

import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
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
      <EmptyState
        icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
        title="No products found"
        subtitle="Try adjusting your search or filters"
        actionLabel={onClearFilters ? "Clear Filters" : undefined}
        onAction={onClearFilters}
      />
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
