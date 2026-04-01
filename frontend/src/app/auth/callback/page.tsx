"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError(true);
      return;
    }

    const handleCallback = async () => {
      try {
        Cookies.set("alfpat_token", token, { expires: 7 });
        const { data } = await api.get("/auth/me");
        setUser(data);
        const redirect = searchParams.get("redirect") || "/";
        router.push(redirect);
      } catch {
        Cookies.remove("alfpat_token");
        setError(true);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#0B1B3A] mb-2">
            Authentication Failed
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Something went wrong during sign in. Please try again.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold text-sm px-8 py-2.5 rounded-full transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-5 border-4 border-gray-200 border-t-[#F97316] rounded-full animate-spin" />
        <h1 className="text-lg font-bold text-[#0B1B3A] mb-1">
          Logging you in...
        </h1>
        <p className="text-sm text-gray-400">
          Please wait a moment
        </p>
      </div>
    </div>
  );
}
