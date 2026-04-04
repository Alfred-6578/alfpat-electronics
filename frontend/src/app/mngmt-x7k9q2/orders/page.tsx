"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { fetchAdminOrders, updateOrderStatus } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import type { Order, User, ShippingAddress } from "@/lib/types";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "info" | "error"; label: string }> = {
  processing: { variant: "warning", label: "Processing" },
  shipped: { variant: "info", label: "Shipped" },
  delivered: { variant: "success", label: "Delivered" },
  cancelled: { variant: "error", label: "Cancelled" },
};

const PAYMENT_BADGE: Record<string, { variant: "success" | "warning" | "error"; label: string }> = {
  paid: { variant: "success", label: "Paid" },
  pending: { variant: "warning", label: "Pending" },
  failed: { variant: "error", label: "Failed" },
};

const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;
const TIMELINE_STEPS = ["Order Placed", "Payment Confirmed", "Processing", "Shipped", "Delivered"];
const STATUS_TO_STEP: Record<string, number> = { processing: 2, shipped: 3, delivered: 4, cancelled: -1 };

function getCustomer(order: Order): { name: string; email: string; phone: string } {
  const user = order.user as User | undefined;
  const addr = order.shippingAddress as ShippingAddress;
  return {
    name: user?.name || addr?.fullName || "Unknown",
    email: user?.email || "",
    phone: addr?.phone || "",
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [modalStatus, setModalStatus] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    setLoading(true);
    fetchAdminOrders(page, 50)
      .then((res) => {
        setOrders(res.data ?? []);
        setTotalPages(res.totalPages ?? 1);
        setTotalItems(res.totalItems ?? 0);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = useMemo(() => {
    let result = [...orders];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) => {
        const customer = getCustomer(o);
        return (
          o._id.toLowerCase().includes(q) ||
          customer.name.toLowerCase().includes(q) ||
          o.paymentReference?.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== "all") result = result.filter((o) => o.orderStatus === statusFilter);
    if (paymentFilter !== "all") result = result.filter((o) => o.paymentStatus === paymentFilter);

    result.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return result;
  }, [orders, search, statusFilter, paymentFilter, sortOrder]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: updated.orderStatus } : o)));
      if (modalOrder?._id === orderId) setModalOrder({ ...modalOrder, orderStatus: updated.orderStatus });
      toast.success(`Order updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });

  const openModal = (order: Order) => {
    setModalOrder(order);
    setModalStatus(order.orderStatus);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-2xl font-bold text-[#0B1B3A]" style={{ fontFamily: "var(--font-playfair)" }}>Orders</h1>
        {!loading && (
          <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-full">{totalItems}</span>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, customer, or reference..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316]"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] outline-none focus:border-[#F97316] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 self-center mr-1">Status:</span>
          {["all", ...ORDER_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-[#F97316] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}

          <span className="text-xs text-gray-400 self-center ml-3 mr-1">Payment:</span>
          {["all", "paid", "pending", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setPaymentFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                paymentFilter === s ? "bg-[#0B1B3A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-100 rounded w-28 flex-1" />
                <div className="h-4 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded-full w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>}
            title="No orders yet"
            subtitle="Orders will appear here when customers start buying"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {["Order", "Customer", "Items", "Total", "Payment", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const customer = getCustomer(order);
                  const sBadge = STATUS_BADGE[order.orderStatus];
                  const pBadge = PAYMENT_BADGE[order.paymentStatus];

                  return (
                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-[#0B1B3A] font-mono block">#{order._id.slice(0, 8)}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{order.paymentReference?.slice(0, 20)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-[#0B1B3A] block">{customer.name}</span>
                        <span className="text-xs text-gray-400">{customer.phone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                        <span className="text-xs text-gray-400 block truncate max-w-[120px]">{order.items[0]?.name}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-[#0B1B3A]">{formatNaira(order.totalAmount)}</td>
                      <td className="py-3 px-4">{pBadge && <Badge variant={pBadge.variant}>{pBadge.label}</Badge>}</td>
                      <td className="py-3 px-4">{sBadge && <Badge variant={sBadge.variant}>{sBadge.label}</Badge>}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(order)}
                            className="px-3 py-1.5 text-xs font-medium border border-[#0B1B3A] text-[#0B1B3A] rounded-lg hover:bg-[#0B1B3A] hover:text-white transition-colors"
                          >
                            View
                          </button>
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={updatingId === order._id}
                            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#F97316] cursor-pointer disabled:opacity-50"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                          {updatingId === order._id && (
                            <svg className="w-4 h-4 animate-spin text-[#F97316]" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ── Order Detail Modal ── */}
      {modalOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setModalOrder(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
                <h2 className="font-bold text-[#0B1B3A]">Order #{modalOrder._id.slice(0, 8)}</h2>
                <button onClick={() => setModalOrder(null)} className="p-1 text-gray-400 hover:text-[#0B1B3A] transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left — Items */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items</h3>
                    <div className="space-y-3">
                      {modalOrder.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 bg-gray-50" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-300">{item.name[0]}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0B1B3A] truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">x{item.qty}</p>
                          </div>
                          <span className="text-sm font-semibold text-[#0B1B3A]">{formatNaira(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                      <span className="font-bold text-[#0B1B3A]">Total</span>
                      <span className="font-bold text-[#F97316] text-lg">{formatNaira(modalOrder.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Right — Info */}
                  <div className="space-y-5">
                    {/* Customer */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</h3>
                      <p className="text-sm font-semibold text-[#0B1B3A]">{getCustomer(modalOrder).name}</p>
                      <p className="text-xs text-gray-400">{getCustomer(modalOrder).email}</p>
                      <p className="text-xs text-gray-400">{getCustomer(modalOrder).phone}</p>
                    </div>

                    {/* Address */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</h3>
                      <p className="text-sm text-[#0B1B3A]">{modalOrder.shippingAddress.street}</p>
                      <p className="text-sm text-gray-500">{modalOrder.shippingAddress.city}, {modalOrder.shippingAddress.state}</p>
                    </div>

                    {/* Payment */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment</h3>
                      <div className="flex items-center gap-2 mb-1">
                        {PAYMENT_BADGE[modalOrder.paymentStatus] && (
                          <Badge variant={PAYMENT_BADGE[modalOrder.paymentStatus].variant}>
                            {PAYMENT_BADGE[modalOrder.paymentStatus].label}
                          </Badge>
                        )}
                        <span className="text-sm font-medium text-[#0B1B3A]">{formatNaira(modalOrder.totalAmount)}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono">{modalOrder.paymentReference}</p>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Timeline</h3>
                      <div className="space-y-3">
                        {TIMELINE_STEPS.map((step, i) => {
                          const currentStep = STATUS_TO_STEP[modalOrder.orderStatus] ?? 2;
                          const isPaid = modalOrder.paymentStatus === "paid";
                          const isCancelled = modalOrder.orderStatus === "cancelled";

                          let dotColor = "bg-gray-300";
                          let textColor = "text-gray-400";

                          if (i === 0) { dotColor = "bg-green-500"; textColor = "text-[#0B1B3A]"; }
                          else if (i === 1 && isPaid) { dotColor = "bg-green-500"; textColor = "text-[#0B1B3A]"; }
                          else if (i === 1 && !isPaid) { dotColor = "bg-gray-300"; textColor = "text-gray-400"; }
                          else if (isCancelled) { dotColor = "bg-gray-300"; textColor = "text-gray-400"; }
                          else if (i <= currentStep) { dotColor = i === currentStep ? "bg-[#F97316]" : "bg-green-500"; textColor = "text-[#0B1B3A]"; }

                          return (
                            <div key={step} className="flex items-center gap-3">
                              <span className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
                              <span className={`text-sm font-medium ${textColor}`}>{step}</span>
                              {i === 0 && <span className="text-xs text-gray-400 ml-auto">{formatDate(modalOrder.createdAt)}</span>}
                            </div>
                          );
                        })}
                        {modalOrder.orderStatus === "cancelled" && (
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full shrink-0 bg-red-500" />
                            <span className="text-sm font-medium text-red-500">Cancelled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#F97316] cursor-pointer"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleStatusChange(modalOrder._id, modalStatus)}
                    disabled={updatingId === modalOrder._id || modalStatus === modalOrder.orderStatus}
                    className="px-4 py-2 bg-[#F97316] hover:bg-[#EA6A0A] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Update
                  </button>
                </div>
                <button
                  onClick={() => setModalOrder(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
