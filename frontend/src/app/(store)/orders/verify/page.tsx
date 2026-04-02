"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getOrderByReference } from "@/lib/client-api";
import { formatNaira } from "@/lib/formatCurrency";
import Badge from "@/components/ui/Badge";
import type { Order } from "@/lib/types";

type PageStatus = "loading" | "success" | "timeout" | "failed" | "error" | "no_reference";

const WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "";

export default function VerifyPaymentPage() {
  const { user, loading: authLoading } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || "";

  const [status, setStatus] = useState<PageStatus>("loading");
  const [order, setOrder] = useState<Order | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorCountRef = useRef(0);
  const attemptRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const copyRef = () => {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/orders");
      return;
    }
    if (!reference) {
      setStatus("no_reference");
      return;
    }

    const poll = async () => {
      try {
        const result = await getOrderByReference(reference);
        console.log(`[Poll #${attemptRef.current + 1}]`, JSON.stringify(result, null, 2));
        const { found, status: apiStatus, order: apiOrder, error: apiError } = result;

        // Handle authorization / server errors
        if (apiError === "unauthorized") {
          stopPolling();
          setStatus("error");
          return;
        }
        if (apiError === "server_error") {
          errorCountRef.current += 1;
          if (errorCountRef.current >= 3) {
            stopPolling();
            setStatus("error");
          }
          return;
        }

        errorCountRef.current = 0;

        if (found) {
          switch (apiStatus) {
            case "paid":
              stopPolling();
              clearCart();
              sessionStorage.removeItem("alfpat_payment_ref");
              setOrder(apiOrder!);
              setStatus("success");
              return;

            case "failed":
              stopPolling();
              if (apiOrder) setOrder(apiOrder);
              setStatus("failed");
              return;

            case "pending":
              // Keep polling — webhook still processing
              break;
          }
        } else {
          switch (apiStatus) {
            case "not_initialized":
              stopPolling();
              setStatus("no_reference");
              return;

            case "failed":
              stopPolling();
              setStatus("failed");
              return;

            case "processing":
            case "creating":
              // Keep polling — almost there
              break;

            default:
              // Unknown status — count toward timeout
              break;
          }
        }

        // Still polling — increment attempt
        attemptRef.current += 1;
        setAttempt(attemptRef.current);

        if (attemptRef.current >= 20) {
          stopPolling();
          setStatus("timeout");
        }
      } catch {
        errorCountRef.current += 1;
        if (errorCountRef.current >= 3) {
          stopPolling();
          setStatus("error");
        }
      }
    };

    // First poll immediately
    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => stopPolling();
  }, [authLoading, user, reference, router, clearCart, stopPolling]);

  // ━━━━━━ no_reference ━━━━━━
  if (status === "no_reference") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0B1B3A] mb-2">Invalid Payment Link</h1>
          <p className="text-sm text-gray-400 mb-8">No payment reference was found in the URL.</p>
          <div className="flex flex-col gap-3">
            <Link href="/orders" className="w-full py-3 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-full transition-colors text-sm text-center">
              Go to My Orders
            </Link>
            <Link href="/" className="w-full py-3 border-2 border-[#0B1B3A] text-[#0B1B3A] hover:bg-[#0B1B3A] hover:text-white font-semibold rounded-full transition-colors text-sm text-center">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━ loading ━━━━━━
  if (status === "loading") {
    const progressWidth = Math.min((attempt / 20) * 95, 95);

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 border-4 border-orange-100 border-t-[#F97316] rounded-full animate-spin mx-auto" />
          <h1 className="text-2xl font-bold text-[#0B1B3A] mt-6">Confirming your payment...</h1>
          <p className="text-sm text-gray-400 italic mt-2">Please don&apos;t close this page</p>

          <div className="mt-6 max-w-xs mx-auto">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F97316] rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Checking... ({attempt}/20)</p>
        </div>
      </div>
    );
  }

  // ━━━━━━ success ━━━━━━
  if (status === "success" && order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="text-center w-full max-w-md">
          {/* Animated checkmark */}
          <div className="mx-auto w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <circle
                cx="40" cy="40" r="36"
                fill="#10B981"
                className="animate-[scaleIn_0.3s_ease-out_forwards]"
                style={{ transformOrigin: "center" }}
              />
              <polyline
                points="25,42 35,52 55,32"
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="40"
                strokeDashoffset="40"
                className="animate-[drawCheck_0.4s_0.3s_ease-out_forwards]"
              />
            </svg>
          </div>

          <h1
            className="text-3xl font-bold text-[#0B1B3A] mt-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Payment Confirmed! 🎉
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Thank you for shopping with ALFPAT ELECTRONICS
          </p>

          {/* Order summary card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 p-6 text-left">
            {[
              { label: "Order ID", value: `#${order._id.slice(0, 8).toUpperCase()}`, mono: true },
              { label: "Customer", value: order.shippingAddress.fullName },
              { label: "Delivery to", value: `${order.shippingAddress.city}, ${order.shippingAddress.state}` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-400">{row.label}</span>
                <span className={`text-sm font-semibold text-[#0B1B3A] ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-400">Total Paid</span>
              <span className="text-lg font-bold text-[#F97316]">{formatNaira(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-gray-400">Status</span>
              <Badge variant="warning">Processing</Badge>
            </div>
          </div>

          {/* WhatsApp info */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mt-4 flex gap-3 text-left">
            <svg className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-orange-800">
              Our team has been notified via WhatsApp and will contact{" "}
              <span className="font-semibold">{order.shippingAddress.phone}</span>{" "}
              to confirm your delivery details.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => router.push(`/orders/${order._id}`)}
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-full transition-colors text-sm"
            >
              View Order Details →
            </button>
            <button
              onClick={() => router.push("/products")}
              className="w-full py-3 border-2 border-[#0B1B3A] text-[#0B1B3A] hover:bg-[#0B1B3A] hover:text-white font-semibold rounded-full transition-colors text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━ failed ━━━━━━
  if (status === "failed") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="text-center w-full max-w-md">
          {/* Red X */}
          <div className="mx-auto w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <circle cx="40" cy="40" r="36" fill="#EF4444" />
              <path d="M28 28L52 52M52 28L28 52" stroke="white" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#0B1B3A] mt-6">Payment Declined</h1>
          <p className="text-sm text-gray-400 mt-2">Your payment was not successful.</p>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-6 text-left">
            <p className="text-sm text-red-800">
              Don&apos;t worry — no money has been charged to your account.
              Your cart items are still saved. You can try again below.
            </p>
          </div>

          {/* Reference */}
          <div className="mt-4 text-left">
            <p className="text-xs text-gray-400 mb-1">Payment Reference:</p>
            <span className="inline-block bg-orange-50 text-[#F97316] font-mono text-sm font-medium px-3 py-1.5 rounded-full">
              {reference}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-full transition-colors text-sm"
            >
              Try Payment Again
            </button>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, my payment failed. Reference: ${reference}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold rounded-full transition-colors text-sm text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.496A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.326 0-4.48-.697-6.29-1.892l-.438-.298-2.65.889.889-2.65-.298-.438A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Contact Support on WhatsApp
            </a>
            <Link href="/" className="text-sm text-gray-400 hover:text-[#0B1B3A] transition-colors text-center">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━ timeout ━━━━━━
  if (status === "timeout") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="text-center w-full max-w-md">
          {/* Clock icon */}
          <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#0B1B3A] mt-6">Taking Longer Than Expected</h1>
          <p className="text-sm text-gray-400 mt-2">Your payment may still be processing on our end.</p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6 text-left">
            <p className="text-sm text-yellow-800">
              ⚠️ If money was deducted from your account, your order will appear in My Orders within a few minutes.
              Please save your reference number below:
            </p>
          </div>

          {/* Copyable reference */}
          <div className="mt-3 bg-white border border-yellow-300 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <span className="font-mono text-[#F97316] font-bold text-sm">{reference}</span>
            <button
              onClick={copyRef}
              className="text-gray-400 hover:text-[#0B1B3A] transition-colors relative"
            >
              {copied ? (
                <span className="text-xs text-green-600 font-medium">Copied!</span>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/orders"
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-full transition-colors text-sm text-center"
            >
              Check My Orders
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, I made a payment but my order hasn't appeared. Reference: ${reference}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold rounded-full transition-colors text-sm text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.496A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.326 0-4.48-.697-6.29-1.892l-.438-.298-2.65.889.889-2.65-.298-.438A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Contact Support on WhatsApp
            </a>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-3 border-2 border-[#0B1B3A] text-[#0B1B3A] hover:bg-[#0B1B3A] hover:text-white font-semibold rounded-full transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━ error ━━━━━━
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="text-center w-full max-w-md">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#0B1B3A] mt-6">Connection Problem</h1>
        <p className="text-sm text-gray-400 mt-2">We couldn&apos;t verify your payment due to a network issue.</p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-6 text-left">
          <p className="text-sm text-gray-600">
            Your payment with Paystack may have gone through.
            Please check My Orders in a few minutes before trying again.
            Save your reference just in case:
          </p>
        </div>

        {/* Copyable reference */}
        <div className="mt-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono text-[#F97316] font-bold text-sm">{reference}</span>
          <button
            onClick={copyRef}
            className="text-gray-400 hover:text-[#0B1B3A] transition-colors"
          >
            {copied ? (
              <span className="text-xs text-green-600 font-medium">Copied!</span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-full transition-colors text-sm"
          >
            Refresh Page
          </button>
          <Link
            href="/orders"
            className="w-full py-3 border-2 border-[#0B1B3A] text-[#0B1B3A] hover:bg-[#0B1B3A] hover:text-white font-semibold rounded-full transition-colors text-sm text-center"
          >
            Check My Orders
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi, I'm having trouble verifying my payment. Reference: ${reference}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold rounded-full transition-colors text-sm text-center flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.496A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.326 0-4.48-.697-6.29-1.892l-.438-.298-2.65.889.889-2.65-.298-.438A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            Contact Support on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
