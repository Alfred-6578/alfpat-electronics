"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchProducts, fetchCategories } from "@/lib/client-api";
import ProductGrid from "@/components/products/ProductGrid";
import Pagination from "@/components/ui/Pagination";
import type {
  Product,
  Category,
  ProductFilters,
  SortOption,
} from "@/lib/types";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

function ProductsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "",
    sort: (searchParams.get("sort") as SortOption) ?? "newest",
    page: Number(searchParams.get("page")) || 1,
  });

  // Fetch categories once
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Fetch products on filter change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProducts(filters);
      setProducts(result.data ?? []);
      setTotalPages(result.totalPages ?? 1);
      setTotalItems(result.totalItems ?? 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));

    const query = params.toString();
    router.push(`/products${query ? `?${query}` : ""}`, { scroll: false });
  }, [filters, router]);

  const updateFilter = (key: keyof ProductFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key !== "page" ? { page: 1 } : {}),
    }));
  };

  const clearFilters = () => {
    setFilters({ search: "", category: "", sort: "newest", page: 1 });
  };

  const hasActiveFilters = filters.search || filters.category || filters.sort !== "newest";

  const handlePageChange = (page: number) => {
    updateFilter("page", page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedCategoryName = categories.find((c) => c.slug === filters.category)?.name;

  // Sidebar content — shared between desktop and mobile
  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold text-[#0B1B3A] uppercase tracking-wider mb-3">
          Categories
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => updateFilter("category", "")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !filters.category
                  ? "text-[#F97316] bg-orange-50 font-semibold"
                  : "text-gray-500 hover:text-[#0B1B3A] hover:bg-gray-50"
              }`}
            >
              All Products
            </button>
          </li>
          {categories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="animate-pulse mt-2">
                  <div className="h-7 bg-gray-100 rounded-lg" />
                </li>
              ))
            : categories.map((cat) => (
                <li key={cat._id}>
                  <button
                    onClick={() => updateFilter("category", cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      filters.category === cat.slug
                        ? "text-[#F97316] bg-orange-50 font-semibold"
                        : "text-gray-500 hover:text-[#0B1B3A] hover:bg-gray-50"
                    }`}
                  >
                    {filters.category === cat.slug && (
                      <span className="w-0.5 h-4 bg-[#F97316] rounded-full" />
                    )}
                    {cat.name}
                  </button>
                </li>
              ))}
        </ul>
      </div>

      {/* Sort */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-xs font-bold text-[#0B1B3A] uppercase tracking-wider mb-3">
          Sort By
        </h3>
        <ul className="space-y-1">
          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
            ([value, label]) => (
              <li key={value}>
                <button
                  onClick={() => updateFilter("sort", value)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-[#0B1B3A] hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      filters.sort === value
                        ? "border-[#F97316]"
                        : "border-gray-300"
                    }`}
                  >
                    {filters.sort === value && (
                      <span className="w-1.5 h-1.5 bg-[#F97316] rounded-full" />
                    )}
                  </span>
                  {label}
                </button>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-2xl lg:text-3xl font-bold text-[#0B1B3A]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {filters.search
            ? `Results for "${filters.search}"`
            : selectedCategoryName ?? "All Products"}
        </h1>
      </div>

      <div className="flex gap-8">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#0B1B3A] uppercase tracking-wider">
                Filters
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-[#F97316] hover:text-[#EA6A0A] transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <SidebarContent />
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {/* Mobile filter button + top bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              Showing{" "}
              <span className="font-medium text-[#0B1B3A]">
                {products.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#0B1B3A]">{totalItems}</span>{" "}
              products
            </p>

            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#0B1B3A] hover:border-[#F97316] transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
              </button>

              {/* Desktop sort dropdown */}
              <select
                value={filters.sort}
                onChange={(e) =>
                  updateFilter("sort", e.target.value as SortOption)
                }
                className="hidden lg:block px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#0B1B3A] outline-none focus:border-[#F97316] transition-colors cursor-pointer"
              >
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {filters.category && selectedCategoryName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F97316]/30 text-xs font-medium text-[#F97316] bg-orange-50">
                  Category: {selectedCategoryName}
                  <button
                    onClick={() => updateFilter("category", "")}
                    className="hover:text-[#EA6A0A]"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.sort !== "newest" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F97316]/30 text-xs font-medium text-[#F97316] bg-orange-50">
                  Sort: {SORT_LABELS[filters.sort]}
                  <button
                    onClick={() => updateFilter("sort", "newest")}
                    className="hover:text-[#EA6A0A]"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F97316]/30 text-xs font-medium text-[#F97316] bg-orange-50">
                  Search: {filters.search}
                  <button
                    onClick={() => updateFilter("search", "")}
                    className="hover:text-[#EA6A0A]"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Product grid */}
          <ProductGrid
            products={products}
            loading={loading}
            columns={3}
            onClearFilters={clearFilters}
          />

          {/* Pagination */}
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </main>
      </div>

      {/* ── Mobile filter drawer ── */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 lg:hidden ${
          mobileFiltersOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileFiltersOpen(false)}
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out lg:hidden max-h-[85vh] ${
          mobileFiltersOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#0B1B3A]">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-[#F97316]"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <SidebarContent />
          </div>

          {/* Apply button */}
          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold py-3 rounded-full transition-colors text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageInner />
    </Suspense>
  );
}
