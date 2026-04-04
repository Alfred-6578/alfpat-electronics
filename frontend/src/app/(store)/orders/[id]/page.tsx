"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { fetchOrder, verifyPayment } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import Badge from "@/components/ui/Badge";
import type { Order } from "@/lib/types";

const STATUS_BADGE: Record<string, { variant: "success" | "warning" | "info" | "error"; label: string }> = {
  processing: { variant: "warning", label: "Processing" },
  shipped: { variant: "info", label: "Shipped" },
  delivered: { variant: "success", label: "Delivered" },
  cancelled: { variant: "error", label: "Cancelled" },
};

const PAYMENT_BADGE: Record<string, { variant: "success" | "warning" | "error"; label: string }> = {
  paid: { variant: "success", label: "Payment Confirmed" },
  pending: { variant: "warning", label: "Payment Pending" },
  failed: { variant: "error", label: "Payment Failed" },
};

function OrderDetailPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromPaystack, setFromPaystack] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);
  const verifyAttempted = useRef(false);

  const orderId = params.id as string;
  const reference = searchParams.get("reference");

  useEffect(() => {
    if (authLoading || !user) return;

    const loadOrder = async () => {
      setLoading(true);
      try {
        // Verify payment if coming from Paystack
        if (reference && !verifyAttempted.current) {
          verifyAttempted.current = true;
          setFromPaystack(true);
          try {
            const verified = await verifyPayment(reference);
            setOrder(verified);
            setVerificationDone(true);
            clearCart();
          } catch {
            // Verification failed, still fetch the order to show status
          }
        }

        // Always fetch fresh order data
        const data = await fetchOrder(orderId);
        setOrder(data);
        if (reference) setVerificationDone(true);

        // Auto-verify if order is still pending and has a payment reference
        if (data.paymentStatus === "pending" && data.paymentReference && !reference) {
          try {
            const verified = await verifyPayment(data.paymentReference);
            setOrder(verified);
          } catch {
            // Paystack might not have the payment yet — that's okay
          }
        }
      } catch {
        setError("Order not found or you don't have permission to view it.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [authLoading, user, orderId, reference, clearCart]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin mb-5" />
        <h2 className="text-lg font-bold text-[#0B1B3A] mb-1">
          {reference ? "Confirming your payment..." : "Loading order..."}
        </h2>
        <p className="text-sm text-gray-400">Please wait a moment</p>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#0B1B3A] mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <Link href="/products" className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-8 py-3 rounded-full transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusBadge = STATUS_BADGE[order.orderStatus];
  const paymentBadge = PAYMENT_BADGE[order.paymentStatus];

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
      {/* Success banner */}
      {fromPaystack && verificationDone && order.paymentStatus === "paid" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-1">
            Payment Successful! 🎉
          </h2>
          <p className="text-sm text-green-700 mb-1">
            Your order has been placed and we&apos;ll contact you shortly.
          </p>
          <p className="text-xs text-green-600/70">
            A WhatsApp notification has been sent to our team
          </p>
        </div>
      )}

      {/* Failed payment banner */}
      {fromPaystack && verificationDone && order.paymentStatus === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-1">Payment Failed</h2>
          <p className="text-sm text-red-700 mb-4">
            Something went wrong with your payment
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/checkout"
              className="bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-red-700 hover:text-red-800 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}

      {/* Order card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#0B1B3A]">
              Order #{order._id.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-400">{orderDate}</p>
          </div>
          {statusBadge && (
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          )}
        </div>

        {/* Items */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Items Ordered
          </h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-100 bg-gray-50 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gray-300">{item.name[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0B1B3A] truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">x{item.qty}</p>
                </div>
                <span className="text-sm font-bold text-[#F97316] shrink-0">
                  {formatNaira(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="px-6 py-5 border-b border-gray-100 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="font-medium text-[#0B1B3A]">{formatNaira(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Delivery</span>
            <span className="font-medium text-[#F97316]">To be confirmed</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-gray-50">
            <span className="font-bold text-[#0B1B3A]">Total</span>
            <span className="text-xl font-bold text-[#0B1B3A]">{formatNaira(order.totalAmount)}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Delivery Address
          </h3>
          <p className="text-sm font-semibold text-[#0B1B3A] mb-1">
            {order.shippingAddress.fullName}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {order.shippingAddress.phone}
          </div>
          <p className="text-sm text-gray-500">
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
        </div>

        {/* Payment status */}
        <div className="px-6 py-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Payment
          </h3>
          <div className="flex items-center justify-between">
            {paymentBadge && (
              <Badge variant={paymentBadge.variant}>{paymentBadge.label}</Badge>
            )}
            <span className="text-xs text-gray-400 font-mono">
              {order.paymentReference}
            </span>
          </div>

          {order.paymentStatus === "pending" && (
            <button
              onClick={async () => {
                try {
                  const verified = await verifyPayment(order.paymentReference);
                  setOrder(verified);
                  if (verified.paymentStatus === "paid") {
                    clearCart();
                  }
                } catch {
                  // Still pending on Paystack's end
                }
              }}
              className="mt-3 text-sm font-medium text-[#F97316] hover:text-[#EA6A0A] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check payment status
            </button>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
            <Link href="#" className="text-sm font-medium text-[#F97316] hover:text-[#EA6A0A] transition-colors">
              Need help with this order?
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="text-sm font-medium text-[#0B1B3A] hover:text-[#F97316] transition-colors"
          >
            View All Orders
          </Link>
          <Link
            href="/products"
            className="border border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetailPageInner />
    </Suspense>
  );
}
