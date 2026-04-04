"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { AxiosError } from "axios";

type PageState = "form" | "success" | "invalid";
type Strength = "weak" | "medium" | "strong";

function getStrength(password: string): Strength {
  if (password.length < 8) return "weak";
  if (/[\d!@#$%^&*(),.?":{}|<>]/.test(password)) return "strong";
  return "medium";
}

const strengthConfig: Record<Strength, { bars: number; color: string; label: string }> = {
  weak: { bars: 1, color: "bg-red-500", label: "Weak" },
  medium: { bars: 2, color: "bg-orange-500", label: "Medium" },
  strong: { bars: 3, color: "bg-green-500", label: "Strong" },
};

function EyeToggle({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0B1B3A] transition-colors"
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { setUser } = useAuth();
  const { syncWithDB } = useCart();

  const [pageState, setPageState] = useState<PageState>(token ? "form" : "invalid");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(3);

  const strength = getStrength(newPassword);
  const sc = strengthConfig[strength];
  const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword && !loading;

  // Redirect countdown after success
  useEffect(() => {
    if (pageState !== "success") return;
    if (countdown <= 0) {
      router.push("/");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [pageState, countdown, router]);

  const handleConfirmBlur = () => {
    setMismatch(confirmPassword !== "" && newPassword !== confirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        newPassword,
        confirmPassword,
      });

      // Auto-login
      Cookies.set("alfpat_token", data.token, { expires: 7 });
      setUser(data.user);
      await syncWithDB();
      setPageState("success");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string; code?: string }>;
      const resData = axiosErr.response?.data;

      if (resData?.message?.includes("invalid") || resData?.message?.includes("expired")) {
        setPageState("invalid");
      } else {
        setError(resData?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ━━━ LEFT COLUMN (shared) ━━━
  const LeftColumn = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0B1B3A] relative flex-col justify-between p-12">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>ALFPAT</span>
        <span className="w-px h-6 bg-[#F97316]" />
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/70">Electronics</span>
      </Link>
      <div>
        <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
          {title}
        </h2>
        <p className="text-white/50 text-sm max-w-md">{subtitle}</p>
      </div>
      <div />
    </div>
  );

  const MobileLogo = () => (
    <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
      <span className="text-2xl font-bold text-[#0B1B3A]" style={{ fontFamily: "var(--font-playfair)" }}>ALFPAT</span>
      <span className="w-px h-6 bg-[#F97316]" />
      <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#0B1B3A]">Electronics</span>
    </Link>
  );

  // ━━━ INVALID ━━━
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen flex">
        <LeftColumn title="Link expired" subtitle="Reset links are only valid for 1 hour." />
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md text-center">
            <MobileLogo />

            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#0B1B3A] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              Invalid Reset Link
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              This link is invalid or has already expired.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">
                Reset links expire after 1 hour for security. Please request a new one.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/forgot-password"
                className="w-full py-3 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-full transition-colors text-sm text-center"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-[#0B1B3A] transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━ SUCCESS ━━━
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex">
        <LeftColumn title="You're all set!" subtitle="Your password has been updated." />
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md text-center">
            <MobileLogo />

            {/* Animated checkmark */}
            <div className="mx-auto w-20 h-20 mb-6">
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

            <h1 className="text-2xl font-bold text-[#0B1B3A] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              Password Reset! 🎉
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Your password has been updated successfully.
            </p>

            <p className="text-xs text-gray-400 mb-4">
              Redirecting to homepage in {countdown} seconds...
            </p>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold rounded-full transition-colors text-sm"
            >
              Go to Homepage Now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ━━━ FORM ━━━
  return (
    <div className="min-h-screen flex">
      <LeftColumn
        title="Create a new password"
        subtitle="Choose something strong that you haven't used before."
      />

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <MobileLogo />

          <h1 className="text-2xl font-bold text-[#0B1B3A] mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Set New Password
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            Must be at least 8 characters
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="Create a new password"
                />
                <EyeToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} />
              </div>

              {/* Strength indicator */}
              {newPassword.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < sc.bars ? sc.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${
                    strength === "weak" ? "text-red-500" :
                    strength === "medium" ? "text-orange-500" : "text-green-500"
                  }`}>
                    {sc.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (mismatch) setMismatch(false);
                  }}
                  onBlur={handleConfirmBlur}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:ring-2 transition-all ${
                    mismatch
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-gray-200 focus:border-[#F97316] focus:ring-orange-100"
                  }`}
                  placeholder="Confirm your new password"
                />
                <EyeToggle show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
              </div>
              {mismatch && (
                <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-[#F97316] hover:bg-[#EA6A0A] disabled:bg-[#F97316]/60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </form>

          <p className="text-sm text-gray-400 text-center mt-6">
            <Link href="/login" className="font-semibold text-[#F97316] hover:text-[#EA6A0A] transition-colors">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
