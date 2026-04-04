"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchAdminProducts, updateAdminProduct, fetchCategories } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import type { Product, Category } from "@/lib/types";

const ADMIN_BASE = "/mngmt-x7k9q2";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAdminProducts(page, 50)
      .then((res) => {
        setProducts(res.data ?? []);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter) {
        const catId = typeof p.category === "object" ? (p.category as Category)._id : p.category;
        if (catId !== categoryFilter) return false;
      }
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const toggleActive = async (product: Product) => {
    const updated = { ...product, isActive: !product.isActive };
    setProducts((prev) => prev.map((p) => (p._id === product._id ? updated : p)));
    try {
      await updateAdminProduct(product._id, { isActive: !product.isActive });
    } catch {
      setProducts((prev) => prev.map((p) => (p._id === product._id ? product : p)));
    }
  };

  const getCatName = (cat: Category | string | null) =>
    cat && typeof cat === "object" ? cat.name : categories.find((c) => c._id === cat)?.name || "";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#0B1B3A]" style={{ fontFamily: "var(--font-playfair)" }}>
          Products
        </h1>
        <Link
          href={`${ADMIN_BASE}/products/new`}
          className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] outline-none focus:border-[#F97316] cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#F97316] text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-5 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-4 bg-gray-100 rounded" />
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            title="No products found"
            subtitle="Add your first product to start selling"
            actionLabel="Add Product"
            actionHref="/mngmt-x7k9q2/products/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Product</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Price</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Stock</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden lg:table-cell">Status</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden lg:table-cell">Featured</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-300">{product.name[0]}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#0B1B3A]">{product.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{product.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{getCatName(product.category)}</span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      {product.discountPrice ? (
                        <div>
                          <span className="text-sm font-bold text-[#F97316]">{formatNaira(product.discountPrice)}</span>
                          <span className="text-xs text-gray-400 line-through ml-1">{formatNaira(product.price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-[#0B1B3A]">{formatNaira(product.price)}</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {product.stock === 0 ? (
                        <Badge variant="error">Out of Stock</Badge>
                      ) : product.stock <= 5 ? (
                        <Badge variant="warning">{product.stock} left</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className={`flex items-center gap-1.5 text-sm ${product.isActive ? "text-green-600" : "text-gray-400"}`}>
                        <span className={`w-2 h-2 rounded-full ${product.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Featured */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <svg className={`w-5 h-5 ${product.isFeatured ? "text-[#F97316] fill-[#F97316]" : "text-gray-300"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`${ADMIN_BASE}/products/${product._id}/edit`}
                          className="px-3 py-1.5 text-xs font-medium border border-[#0B1B3A] text-[#0B1B3A] rounded-lg hover:bg-[#0B1B3A] hover:text-white transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => toggleActive(product)}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {product.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
