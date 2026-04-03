"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDashboardStats } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import Badge from "@/components/ui/Badge";
import type { DashboardStats, Order, LowStockProduct } from "@/lib/types";

const ADMIN_BASE = "/mngmt-x7k9q2";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "info" | "error"; label: string }> = {
  processing: { variant: "warning", label: "Processing" },
  shipped: { variant: "info", label: "Shipped" },
  delivered: { variant: "success", label: "Delivered" },
  cancelled: { variant: "error", label: "Cancelled" },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trendLabel: string;
  highlight?: boolean;
}

function StatCard({ title, value, icon, iconBg, trendLabel, highlight }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${highlight ? "border-orange-200" : "border-gray-100"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-[#0B1B3A] mt-1">{value}</p>
      <div className="mt-1 pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-400">{trendLabel}</span>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-28 mt-3" />
      <div className="mt-1 pt-1 border-t border-gray-50">
        <div className="h-3 bg-gray-100 rounded w-24" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-7 bg-gray-200 rounded w-20" />
          <div className="h-7 bg-gray-100 rounded w-28 flex-1" />
          <div className="h-7 bg-gray-100 rounded w-16" />
          <div className="h-7 bg-gray-200 rounded w-20" />
          <div className="h-7 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-NG", { month: "short", day: "numeric" });

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              iconBg="bg-orange-50"
              icon={
                <svg className="w-5 h-5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
              trendLabel="All time"
            />
            <StatCard
              title="Revenue"
              value={formatNaira(stats.totalRevenue)}
              iconBg="bg-green-50"
              icon={
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              trendLabel="From paid orders"
            />
            <StatCard
              title="Products"
              value={stats.totalProducts}
              iconBg="bg-blue-50"
              icon={
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              trendLabel="Active products"
            />
            <StatCard
              title="Pending"
              value={stats.pendingOrders}
              iconBg="bg-yellow-50"
              icon={
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              trendLabel="Need attention"
              highlight={stats.pendingOrders > 0}
            />
          </>
        ) : null}
      </div>

      {/* Two column */}
      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-[#0B1B3A]">Recent Orders</h2>
            <Link href={`${ADMIN_BASE}/orders`} className="text-sm font-medium text-[#F97316] hover:text-[#EA6A0A] transition-colors">
              View All →
            </Link>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : stats && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Order ID</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Customer</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Items</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Total</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">Status</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: Order) => {
                    const badge = STATUS_BADGE[order.orderStatus];
                    const customerName =
                      typeof order.user === "object" && order.user
                        ? order.user.name
                        : order.shippingAddress?.fullName || "Guest";
                    return (
                      <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-[#F97316] font-mono">
                            #{order._id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#0B1B3A]">{customerName}</td>
                        <td className="py-3 px-4 text-sm text-gray-400 hidden sm:table-cell">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-[#0B1B3A]">
                          {formatNaira(order.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400 hidden md:table-cell">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">No orders yet</div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-[#0B1B3A] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`${ADMIN_BASE}/products/new`}
                className="bg-[#F97316] text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-[#EA6A0A] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-xs font-medium">Add Product</span>
              </Link>
              <Link
                href={`${ADMIN_BASE}/orders`}
                className="bg-[#0B1B3A] text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-[#0B1B3A]/90 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
                <span className="text-xs font-medium">View Orders</span>
              </Link>
              <Link
                href={`${ADMIN_BASE}/categories`}
                className="bg-gray-100 text-[#0B1B3A] rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                </svg>
                <span className="text-xs font-medium">Add Category</span>
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 text-[#0B1B3A] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="text-xs font-medium">View Store</span>
              </a>
            </div>
          </div>

          {/* Low stock */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-[#0B1B3A]">Low Stock Alert</h2>
              {stats && stats.lowStockProducts?.length > 0 && (
                <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2 py-0.5 rounded-full">
                  {stats.lowStockProducts?.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-6 space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                    <div className="h-4 bg-gray-200 rounded flex-1" />
                    <div className="h-5 bg-gray-200 rounded-full w-16" />
                  </div>
                ))}
              </div>
            ) : stats && stats.lowStockProducts?.length > 0 ? (
              <div>
                {stats.lowStockProducts.map((product: LowStockProduct) => (
                  <div key={product._id} className="px-6 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-8 h-8 rounded-lg object-cover bg-gray-50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">{product.name[0]}</span>
                      </div>
                    )}
                    <span className="text-sm text-[#0B1B3A] truncate flex-1">{product.name}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        product.stock === 0
                          ? "bg-red-50 text-red-600"
                          : product.stock <= 3
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-[#F97316]"
                      }`}
                    >
                      {product.stock === 0 ? "Out of Stock" : `${product.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">All products are well stocked</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
