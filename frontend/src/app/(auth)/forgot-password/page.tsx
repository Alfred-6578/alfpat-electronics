"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { AxiosError } from "axios";

const FROM_EMAIL = process.env.NEXT_PUBLIC_FROM_EMAIL || "noreply@alfpat.com";

type PageState = "form" | "sent";

export default function ForgotPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setPageState("sent");
      startCountdown();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message || "";

      if (status === 429) {
        setError("Please wait a few minutes before trying again.");
      } else if (status === 400 && message.toLowerCase().includes("google")) {
        setError("This account uses Google login. Please use the Google login button instead.");
      } else {
        setError(message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      startCountdown();
    } catch {
      // Silent — already sent once
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ━━━ SENT state ━━━
  if (pageState === "sent") {
    return (
      <div className="min-h-screen flex">
        {/* Left column */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0B1B3A] relative flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
              ALFPAT
            </span>
            <span className="w-px h-6 bg-[#F97316]" />
            <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/70">Electronics</span>
          </Link>
          <div>
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
              Check your
              <br />
              inbox
            </h2>
          </div>
          <div />
        </div>

        {/* Right column */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md text-center">
            {/* Mobile logo */}
            <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden justify-center">
              <span className="text-2xl font-bold text-[#0B1B3A]" style={{ fontFamily: "var(--font-playfair)" }}>ALFPAT</span>
              <span className="w-px h-6 bg-[#F97316]" />
              <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#0B1B3A]">Electronics</span>
            </Link>

            {/* Envelope icon */}
            <div className="w-20 h-20 mx-auto mb-6 animate-bounce">
              <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                <rect x="10" y="20" width="60" height="40" rx="6" fill="#F97316" opacity="0.15" />
                <rect x="10" y="20" width="60" height="40" rx="6" stroke="#F97316" strokeWidth="3" fill="none" />
                <path d="M10 26L40 46L70 26" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#0B1B3A] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              Check your inbox! 📧
            </h1>
            <p className="text-lg font-bold text-[#F97316] mb-1">{email}</p>
            <p className="text-sm text-gray-400 mb-1">
              We sent a password reset link to this address.
            </p>
            <p className="text-xs text-gray-400 italic">
              The link expires in 1 hour.
            </p>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6 text-left">
              <p className="text-sm text-blue-800">
                💡 Can&apos;t find the email? Check your spam folder. The email comes from{" "}
                <span className="font-medium">{FROM_EMAIL}</span>
              </p>
            </div>

            {/* Resend section */}
            <div className="mt-6">
              {canResend ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-400">Didn&apos;t get it?</span>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm font-semibold text-[#F97316] hover:text-[#EA6A0A] transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Resend reset email"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Resend available in <span className="font-mono font-medium text-[#0B1B3A]">{formatTime(countdown)}</span>
                </p>
              )}
            </div>

            {/* Try different email */}
            <button
              onClick={() => {
                setPageState("form");
                setEmail("");
                setError("");
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              className="text-sm text-gray-400 hover:text-[#0B1B3A] transition-colors mt-4 inline-block"
            >
              Try a different email
            </button>

            <div className="mt-8">
              <Link href="/login" className="text-sm font-semibold text-[#F97316] hover:text-[#EA6A0A] transition-colors">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━ FORM state ━━━
  return (
    <div className="min-h-screen flex">
      {/* Left column */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B1B3A] relative flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
            ALFPAT
          </span>
          <span className="w-px h-6 bg-[#F97316]" />
          <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/70">Electronics</span>
        </Link>

        <div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            Forgot your
            <br />
            password?
          </h2>
          <p className="text-white/50 text-sm max-w-md">
            No worries — it happens to everyone. Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div />
      </div>

      {/* Right column */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl font-bold text-[#0B1B3A]" style={{ fontFamily: "var(--font-playfair)" }}>ALFPAT</span>
            <span className="w-px h-6 bg-[#F97316]" />
            <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#0B1B3A]">Electronics</span>
          </Link>

          <h1 className="text-2xl font-bold text-[#0B1B3A] mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Reset Password
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            Enter the email address linked to your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#EA6A0A] disabled:bg-[#F97316]/60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </form>

          <p className="text-sm text-gray-400 text-center mt-6">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-[#F97316] hover:text-[#EA6A0A] transition-colors">
              Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
