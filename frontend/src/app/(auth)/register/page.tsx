"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { AxiosError } from "axios";

function RegisterPageInner() {
  const { user, register, loginWithGoogle } = useAuth();
  const { syncWithDB } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  useEffect(() => {
    if (user) router.push(redirect);
  }, [user, router, redirect]);

  const handleConfirmBlur = () => {
    setPasswordMismatch(confirmPassword !== "" && password !== confirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      await syncWithDB();
      router.push(redirect);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
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

  return (
    <div className="min-h-screen flex">
      {/* ── Left column — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B1B3A] relative flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            ALFPAT
          </span>
          <span className="w-px h-6 bg-[#F97316]" />
          <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/70">
            Electronics
          </span>
        </Link>

        <div>
          <h2
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Join thousands of
            <br />
            happy customers
          </h2>
          <p className="text-white/50 text-sm max-w-md">
            Get access to order tracking, exclusive deals and fast checkout
          </p>
        </div>

        <div className="space-y-3">
          {[
            "Track your orders anytime",
            "Save your delivery address",
            "Get notified on deals",
          ].map((text) => (
            <div key={text} className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-[#F97316] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-white/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column — form ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <span
              className="text-2xl font-bold text-[#0B1B3A]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              ALFPAT
            </span>
            <span className="w-px h-6 bg-[#F97316]" />
            <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#0B1B3A]">
              Electronics
            </span>
          </Link>

          <h1
            className="text-2xl font-bold text-[#0B1B3A] mb-1"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Create your account
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            It only takes a minute
          </p>

          {/* Google */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-full shadow-sm hover:border-gray-400 hover:shadow-md transition-all text-sm font-medium text-[#0B1B3A]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR register with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0B1B3A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="Create a password"
                />
                <EyeIcon show={showPassword} toggle={() => setShowPassword(!showPassword)} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">At least 8 characters</p>
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
                    if (passwordMismatch) setPasswordMismatch(false);
                  }}
                  onBlur={handleConfirmBlur}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm text-[#0B1B3A] placeholder-gray-400 outline-none focus:ring-2 transition-all ${
                    passwordMismatch
                      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border-gray-200 focus:border-[#F97316] focus:ring-orange-100"
                  }`}
                  placeholder="Confirm your password"
                />
                <EyeIcon show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
              </div>
              {passwordMismatch && (
                <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
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
              {loading ? "Creating account..." : "Create Account"}
            </button>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </form>

          {/* Login link */}
          <p className="text-sm text-gray-400 text-center mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#F97316] hover:text-[#EA6A0A] transition-colors"
            >
              Login &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
