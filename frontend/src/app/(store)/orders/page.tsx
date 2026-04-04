"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchMyOrders } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import type { Order } from "@/lib/types";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "info" | "error"; label: string }> = {
  processing: { variant: "warning", label: "Processing" },
  shipped: { variant: "info", label: "Shipped" },
  delivered: { variant: "success", label: "Delivered" },
  cancelled: { variant: "error", label: "Cancelled" },
};

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-5 bg-gray-200 rounded w-32" />
        <div className="h-6 bg-gray-200 rounded-full w-24" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex -space-x-2">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-20" />
      </div>
      <div className="border-t border-gray-100 pt-4 flex justify-between">
        <div className="h-5 bg-gray-200 rounded w-28" />
        <div className="h-5 bg-gray-100 rounded w-24" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/orders");
    }
  }, [authLoading, user, router]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await fetchMyOrders(page);
      setOrders(result.data ?? []);
      setTotalPages(result.totalPages ?? 1);
      setTotalItems(result.totalItems ?? 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl lg:text-3xl font-bold text-[#0B1B3A]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          My Orders
        </h1>
        {!loading && (
          <p className="text-sm text-gray-400 mt-1">
            {totalItems} {totalItems === 1 ? "order" : "orders"}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <EmptyState
          icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          title="No orders yet"
          subtitle="When you place an order it will appear here"
          actionLabel="Start Shopping"
          actionHref="/products"
        />
      )}

      {/* Orders list */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusBadge = STATUS_BADGE[order.orderStatus];
            const orderDate = new Date(order.createdAt).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5"
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#0B1B3A] font-mono">
                    Order #{order._id.slice(0, 8)}
                  </span>
                  {statusBadge && (
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  )}
                </div>

                {/* Middle row */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Overlapping images */}
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, i) => (
                      item.image ? (
                        <img
                          key={i}
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-full border-2 border-white object-cover bg-gray-50"
                        />
                      ) : (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center"
                        >
                          <span className="text-xs font-bold text-gray-400">
                            {item.name[0]}
                          </span>
                        </div>
                      )
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500">
                          +{order.items.length - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-400">
                    <span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
                    <span className="mx-2">·</span>
                    <span>Placed on {orderDate}</span>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-[#F97316]">
                      {formatNaira(order.totalAmount)}
                    </span>
                    <div className="mt-0.5">
                      {order.paymentStatus === "paid" && (
                        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Paid
                        </span>
                      )}
                      {order.paymentStatus === "pending" && (
                        <span className="text-xs font-medium text-yellow-600">⏳ Payment Pending</span>
                      )}
                      {order.paymentStatus === "failed" && (
                        <span className="text-xs font-medium text-red-500">✗ Payment Failed</span>
                      )}
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-[#F97316] flex items-center gap-1">
                    View Details
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
